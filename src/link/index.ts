import { TRPCClientError, TRPCLink } from "@trpc/client";
import type { AnyRouter } from "@trpc/server";
import { observable } from "@trpc/server/observable";

import type {
  MessagePassingEventListener,
  TRPCMessagePassingRequest,
} from "../types";

export type MessagePassingLinkOption = {
  postMessage: (args: { message: TRPCMessagePassingRequest }) => void;
  addEventListener: MessagePassingEventListener;
  removeEventListener: MessagePassingEventListener;
};

export const messagePassingLink = <TRouter extends AnyRouter>(
  opts: MessagePassingLinkOption,
): TRPCLink<TRouter> => {
  console.log("window postMessage link created");

  return (runtime) => {
    // here we just got initialized in the app - this happens once per app
    // useful for storing cache for instance
    console.log(`init runtime ${runtime}`);
    const { addEventListener, postMessage, removeEventListener } = opts;

    return ({ op }) => {
      console.log("op.context", op.context);

      return observable((observer) => {
        // why do we observe.complete immediately?
        observer.complete();
        const listeners: (() => void)[] = [];

        const { id, type, path } = op;

        try {
          const input = runtime.transformer.serialize(op.input);

          const onMessage: Parameters<MessagePassingEventListener>[0] = (
            event,
          ) => {
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
            if (id !== trpc.id) {
              return;
            }

            if ("error" in trpc) {
              const error = runtime.transformer.deserialize(trpc.error);
              observer.error(TRPCClientError.from({ ...trpc, error }));
              return;
            }

            if ("result" in trpc) {
              observer.next({
                result: {
                  ...trpc.result,
                  // Questionable if we need !trpc.result.type
                  ...((!trpc.result.type || trpc.result.type === "data") && {
                    type: "data",
                    data: runtime.transformer.deserialize(trpc.result.data),
                  }),
                },
              });

              if (type !== "subscription" || trpc.result.type === "stopped") {
                observer.complete();
              }
            }
          };

          addEventListener(onMessage);
          listeners.push(() => removeEventListener(onMessage));

          postMessage({
            message: {
              trpc: {
                id,
                jsonrpc: undefined,
                method: type,
                params: { path, input },
              },
            },
          });
        } catch (cause) {
          observer.error(
            new TRPCClientError(
              cause instanceof Error ? cause.message : "Unknown error",
            ),
          );
        }

        return () => {
          listeners.forEach((unsub) => unsub());
          if (type === "subscription") {
            postMessage({
              message: {
                trpc: {
                  id,
                  jsonrpc: undefined,
                  method: "subscription.stop",
                },
              },
            });
          }
        };
      });
    };
  };
};

const test = [
  messagePassingLink({
    postMessage: ({ message }) => window.postMessage(message, "*"),
    addEventListener: (listener) =>
      window.addEventListener("message", (e) => {
        if (e.origin !== location.href) {
          return;
        }
        listener(e);
      }),
    removeEventListener: (listener) =>
      window.removeEventListener("message", listener),
  }),
];
