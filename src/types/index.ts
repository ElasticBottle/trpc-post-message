import type {
  TRPCClientOutgoingMessage,
  TRPCErrorResponse,
  TRPCResultMessage,
} from "@trpc/server/rpc";

export type PostMessageEventListener = (
  listener: (e: MessageEvent) => any,
) => void;

export type TRPCPostMessageRequest = {
  trpc: TRPCClientOutgoingMessage;
};

export type TRPCPostMessageSuccessResponse = TRPCResultMessage<any>;

export type TRPCPostMessageErrorResponse = TRPCErrorResponse;

export type TRPCPostMessageResponse = {
  trpc: TRPCPostMessageSuccessResponse | TRPCPostMessageErrorResponse;
};
