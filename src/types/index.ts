import type {
  TRPCClientOutgoingMessage,
  TRPCErrorResponse,
  TRPCResultMessage,
} from "@trpc/server/rpc";

export type EventListener = (e: MessageEvent) => any;
export type PostMessageEventListener = (
  listener: EventListener,
) => EventListener | void;

export type TRPCPostMessageRequest = {
  trpc: TRPCClientOutgoingMessage;
};

export type TRPCPostMessageSuccessResponse = TRPCResultMessage<any>;

export type TRPCPostMessageErrorResponse = TRPCErrorResponse;

export type TRPCPostMessageResponse = {
  trpc: TRPCPostMessageSuccessResponse | TRPCPostMessageErrorResponse;
};
