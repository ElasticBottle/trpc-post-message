import { resetMocks } from "./__setup";

import { createTRPCProxyClient } from "@trpc/client";
import { initTRPC } from "@trpc/server";
import { observable, Unsubscribable } from "@trpc/server/observable";
import { z } from "zod";

import { createPostMessageHandler } from "../src/adapter";
import { postMessageLink } from "../src/link";

afterEach(() => {
  jest.clearAllMocks();
  resetMocks();
});

const t = initTRPC.create();

const appRouter = t.router({
  echoQuery: t.procedure
    .input(z.object({ payload: z.string() }))
    .query(({ input }) => input),
  echoMutation: t.procedure
    .input(z.object({ payload: z.string() }))
    .mutation(({ input }) => input),
  echoSubscription: t.procedure
    .input(z.object({ payload: z.string() }))
    .subscription(({ input }) =>
      observable<typeof input>((emit) => {
        emit.next(input);
      }),
    ),
  nestedRouter: t.router({
    echoQuery: t.procedure
      .input(z.object({ payload: z.string() }))
      .query(({ input }) => input),
    echoMutation: t.procedure
      .input(z.object({ payload: z.string() }))
      .mutation(({ input }) => input),
    echoSubscription: t.procedure
      .input(z.object({ payload: z.string() }))
      .subscription(({ input }) =>
        observable((emit) => {
          emit.next(input);
        }),
      ),
  }),
});

test("with query", async () => {
  // background
  createPostMessageHandler({
    router: appRouter,
    addEventListener(listener) {
      window.addEventListener("message", (event) => {
        listener(event);
      });
    },
    postMessage({ message }) {
      window.postMessage(message, "*");
    },
  });
  expect(window.addEventListener).toHaveBeenCalledTimes(1);

  // content
  const trpc = createTRPCProxyClient<typeof appRouter>({
    links: [
      postMessageLink({
        addEventListener(listener) {
          window.addEventListener("message", (event) => {
            listener(event);
          });
        },
        postMessage({ message }) {
          window.postMessage(message, "*");
        },
        removeEventListener(listener) {
          window.removeEventListener("message", listener);
        },
      }),
    ],
  });

  const data1 = await trpc.echoQuery.query({ payload: "query1" });
  expect(data1).toEqual({ payload: "query1" });

  const data2 = await trpc.nestedRouter.echoQuery.query({ payload: "query2" });
  expect(data2).toEqual({ payload: "query2" });

  const [data3, data4] = await Promise.all([
    trpc.echoQuery.query({ payload: "query3" }),
    trpc.echoQuery.query({ payload: "query4" }),
  ]);
  expect(data3).toEqual({ payload: "query3" });
  expect(data4).toEqual({ payload: "query4" });
});

test("with mutation", async () => {
  // background
  createPostMessageHandler({
    router: appRouter,
    addEventListener(listener) {
      window.addEventListener("message", (event) => {
        listener(event);
      });
    },
    postMessage({ message }) {
      window.postMessage(message, "*");
    },
  });
  expect(window.addEventListener).toHaveBeenCalledTimes(1);

  // content
  const trpc = createTRPCProxyClient<typeof appRouter>({
    links: [
      postMessageLink({
        addEventListener(listener) {
          window.addEventListener("message", (event) => {
            listener(event);
          });
        },
        postMessage({ message }) {
          window.postMessage(message, "*");
        },
        removeEventListener(listener) {
          window.removeEventListener("message", listener);
        },
      }),
    ],
  });

  const data1 = await trpc.echoMutation.mutate({ payload: "mutation1" });
  expect(data1).toEqual({ payload: "mutation1" });

  const data2 = await trpc.nestedRouter.echoMutation.mutate({
    payload: "mutation2",
  });
  expect(data2).toEqual({ payload: "mutation2" });

  const [data3, data4] = await Promise.all([
    trpc.echoMutation.mutate({ payload: "mutation3" }),
    trpc.echoMutation.mutate({ payload: "mutation4" }),
  ]);
  expect(data3).toEqual({ payload: "mutation3" });
  expect(data4).toEqual({ payload: "mutation4" });
});

test("with subscription", async () => {
  // background
  createPostMessageHandler({
    router: appRouter,
    addEventListener(listener) {
      window.addEventListener("message", (event) => {
        listener(event);
      });
    },
    postMessage({ message }) {
      window.postMessage(message, "*");
    },
  });
  expect(window.addEventListener).toHaveBeenCalledTimes(1);

  // content
  const trpc = createTRPCProxyClient<typeof appRouter>({
    links: [
      postMessageLink({
        addEventListener(listener) {
          window.addEventListener("message", (event) => {
            listener(event);
          });
        },
        postMessage({ message }) {
          window.postMessage(message, "*");
        },
        removeEventListener(listener) {
          window.removeEventListener("message", listener);
        },
      }),
    ],
  });

  const onDataMock = jest.fn();
  const onCompleteMock = jest.fn();
  const onErrorMock = jest.fn();
  const onStartedMock = jest.fn();
  const onStoppedMock = jest.fn();
  const subscription = await new Promise<Unsubscribable>((resolve) => {
    const subscription = trpc.echoSubscription.subscribe(
      { payload: "subscription1" },
      {
        onData: (data) => {
          onDataMock(data);
          resolve(subscription);
        },
        onComplete: onCompleteMock,
        onError: onErrorMock,
        onStarted: onStartedMock,
        onStopped: onStoppedMock,
      },
    );
  });
  expect(onDataMock).toHaveBeenCalledTimes(1);
  expect(onDataMock).toHaveBeenNthCalledWith(1, { payload: "subscription1" });
  expect(onCompleteMock).toHaveBeenCalledTimes(0);
  expect(onErrorMock).toHaveBeenCalledTimes(0);
  expect(onStartedMock).toHaveBeenCalledTimes(1);
  expect(onStoppedMock).toHaveBeenCalledTimes(0);
  subscription.unsubscribe();
  expect(onDataMock).toHaveBeenCalledTimes(1);
  expect(onCompleteMock).toHaveBeenCalledTimes(1);
  expect(onErrorMock).toHaveBeenCalledTimes(0);
  expect(onStartedMock).toHaveBeenCalledTimes(1);
  expect(onStoppedMock).toHaveBeenCalledTimes(1);
});

// with error
// with createcontext
// with output
// with MessageChannel
// with Workers
