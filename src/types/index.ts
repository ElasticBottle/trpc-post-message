import type {
  TRPCClientOutgoingMessage,
  TRPCErrorResponse,
  TRPCResultMessage,
} from "@trpc/server/rpc";

export type MessagePassingEventListener = (
  event: string,
  listener: (e: MessageEvent) => any,
) => void;

export type TRPCMessagePassingRequest = {
  trpc: TRPCClientOutgoingMessage;
};

export type TRPCMessagePassingSuccessResponse = TRPCResultMessage<any>;

export type TRPCMessagePassingErrorResponse = TRPCErrorResponse;

export type TRPCMessagePassingResponse = {
  trpc: TRPCMessagePassingSuccessResponse | TRPCMessagePassingErrorResponse;
};
