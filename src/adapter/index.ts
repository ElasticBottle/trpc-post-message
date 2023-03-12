import {
  AnyProcedure,
  AnyRouter,
  ProcedureType,
  TRPCError,
} from "@trpc/server";
import type { NodeHTTPCreateContextOption } from "@trpc/server/dist/adapters/node-http/types";
import type { BaseHandlerOptions } from "@trpc/server/dist/internals/types";
import { isObservable, Unsubscribable } from "@trpc/server/observable";

import type {
  PostMessageEventListener,
  TRPCPostMessageResponse,
} from "../types";
import { getErrorFromUnknown } from "./errors";

export type CreatePostMessageContextOptions = {
  req: MessageEvent;
  res: undefined;
};

export type CreatePostMessageHandlerOptions<TRouter extends AnyRouter> = Pick<
  BaseHandlerOptions<TRouter, CreatePostMessageContextOptions["req"]> &
    NodeHTTPCreateContextOption<
      TRouter,
      CreatePostMessageContextOptions["req"],
      CreatePostMessageContextOptions["res"]
    >,
  "router" | "createContext" | "onError"
> & {
  postMessage: (args: {
    message: TRPCPostMessageResponse;
    opts: { event: MessageEvent };
  }) => void;
  addEventListener: PostMessageEventListener;
};

export const createPostMessageHandler = <TRouter extends AnyRouter>(
  opts: CreatePostMessageHandlerOptions<TRouter>,
) => {
  const { router, createContext, onError, addEventListener, postMessage } =
    opts;
  const { transformer } = router._def._config;

  const subscriptions = new Map<number | string, Unsubscribable>();

  const onMessage: Parameters<PostMessageEventListener>[0] = async (event) => {
    // TODO: maybe check origin somehow?
    const { data } = event;

    if (!("trpc" in data)) {
      return;
    }
    const { trpc } = data;
    if (!trpc) {
      return;
    }
    if (
      !("id" in trpc) ||
      (typeof trpc.id !== "number" && typeof trpc.id !== "string")
    ) {
      return;
    }
    if ("jsonrpc" in trpc && trpc.jsonrpc !== "2.0") {
      return;
    }
    if (
      !("method" in trpc) ||
      (trpc.method !== "query" &&
        trpc.method !== "mutation" &&
        trpc.method !== "subscription" &&
        trpc.method !== "subscription.stop")
    ) {
      return;
    }

    const {
      id,
      jsonrpc,
      method,
    }: {
      id: string | number;
      jsonrpc: "2.0" | undefined;
      method: string;
    } = trpc;

    const sendResponse = (response: TRPCPostMessageResponse["trpc"]) => {
      postMessage({
        message: { trpc: { id, jsonrpc, ...response } },
        opts: {
          event,
        },
      });
    };

    let params: { path: string; input: unknown } | undefined;
    let input: any;
    let ctx: any;
    try {
      if (method === "subscription.stop") {
        const subscription = subscriptions.get(id);
        if (subscription) {
          subscription.unsubscribe();
          sendResponse({
            result: {
              type: "stopped",
            },
          });
          subscriptions.delete(id);
        }
        return;
      }

      // params should always be present for 'query', 'subscription' and 'mutation' {@param method}
      ({ params } = trpc);
      if (!params) {
        return;
      }

      input = transformer.input.deserialize(params.input);

      ctx = await createContext?.({ req: event, res: undefined });
      const caller = router.createCaller(ctx);

      const segments = params.path.split(".");
      const procedureFn = segments.reduce(
        (acc, segment) => acc[segment],
        caller as any,
      ) as AnyProcedure;

      const result = await procedureFn(input);

      if (method !== "subscription") {
        const data = transformer.output.serialize(result);
        sendResponse({
          result: {
            type: "data",
            data,
          },
        });
        return;
      }

      if (!isObservable(result)) {
        throw new TRPCError({
          message: `Subscription ${params.path} did not return an observable`,
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      const subscription = result.subscribe({
        next: (data) => {
          sendResponse({
            result: {
              type: "data",
              data,
            },
          });
        },
        error: (cause) => {
          const error = getErrorFromUnknown(cause);

          onError?.({
            error,
            type: method,
            path: params?.path,
            input,
            ctx,
            req: event,
          });

          sendResponse({
            error: router.getErrorShape({
              error,
              type: method,
              path: params?.path,
              input,
              ctx,
            }),
          });
        },
        complete: () => {
          sendResponse({
            result: {
              type: "stopped",
            },
          });
        },
      });

      if (subscriptions.has(id)) {
        subscription.unsubscribe();
        sendResponse({
          result: {
            type: "stopped",
          },
        });
        throw new TRPCError({
          message: `Duplicate id ${id}`,
          code: "BAD_REQUEST",
        });
      }
      subscriptions.set(id, subscription);

      sendResponse({
        result: {
          type: "started",
        },
      });
      return;
    } catch (cause) {
      const error = getErrorFromUnknown(cause);

      onError?.({
        error,
        type: method as ProcedureType,
        path: params?.path,
        input,
        ctx,
        req: event,
      });

      sendResponse({
        error: router.getErrorShape({
          error,
          type: method as ProcedureType,
          path: params?.path,
          input,
          ctx,
        }),
      });
    }
  };

  addEventListener(onMessage);
};
