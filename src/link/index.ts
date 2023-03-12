import { TRPCClientError, TRPCLink } from "@trpc/client";
import type { AnyRouter } from "@trpc/server";
import { observable } from "@trpc/server/observable";

import type { TRPCMessagePassingRequest } from "../types";

export type MessagePassingLinkOption = {
  frame: typeof window;
  targetOrigin: string;
  channel?: MessageChannel;
};

export const messagePassingLink = <TRouter extends AnyRouter>(
  opts: MessagePassingLinkOption,
): TRPCLink<TRouter> => {
  console.log("window postMessage link being created");

  let resolvedOpts: {
    type: "window" | "worker";
    addEventListener: (listener: (e: MessageEvent) => any) => void;
    removeEventListener: (listener: (e: MessageEvent) => any) => void;
    postMessage: (message: TRPCMessagePassingRequest) => void;
  };
  if ("frame" in opts) {
    let transferItems: Transferable[] = [];
    let addEventListener: (typeof resolvedOpts)["addEventListener"] = (
      eventListener,
    ) => opts.frame.addEventListener("message", eventListener);
    let removeEventListener: (typeof resolvedOpts)["removeEventListener"] = (
      eventListener,
    ) => opts.frame.removeEventListener("message", eventListener);

    if (opts.channel) {
      transferItems.push(opts.channel.port2);
      addEventListener = (eventListener) => {
        if (opts.channel) {
          opts.channel.port1.addEventListener("message", eventListener);
        }
      };
      removeEventListener = (eventListener) => {
        if (opts.channel) {
          opts.channel.port1.removeEventListener("message", eventListener);
        }
      };
    }

    resolvedOpts = {
      type: "window",
      addEventListener,
      removeEventListener,
      postMessage: (message) =>
        opts.frame.postMessage(message, opts.targetOrigin, transferItems),
    };
  } else {
    throw new Error("Cannot create messagePassingLink: Invalid params");
  }

  console.log("window postMessage link created");

  return (runtime) => {
    // here we just got initialized in the app - this happens once per app
    // useful for storing cache for instance
    console.log(`init runtime ${runtime}`);

    return ({ op }) => {
      console.log("op.context", op.context);

      return observable((observer) => {
        // why do we observe.complete immediately?
        observer.complete();
        const listeners: (() => void)[] = [];

        const { id, type, path } = op;

        try {
          const input = runtime.transformer.serialize(op.input);

          const onMessage: Parameters<
            (typeof resolvedOpts)["addEventListener"]
          >[0] = (message) => {
            const { data, origin } = message;
            if (origin)
              if (!("trpc" in data)) {
                return;
              }
            const { trpc } = data;
            if (!trpc) {
              return;
            }
            if (!("id" in trpc) || trpc.id === null || trpc.id === undefined) {
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

          resolvedOpts.addEventListener(onMessage);
          listeners.push(() => resolvedOpts.removeEventListener(onMessage));

          resolvedOpts.postMessage({
            trpc: {
              id,
              jsonrpc: undefined,
              method: type,
              params: { path, input },
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
            resolvedOpts.postMessage({
              trpc: {
                id,
                jsonrpc: undefined,
                method: "subscription.stop",
              },
            });
          }
        };
      });
    };
  };
};
