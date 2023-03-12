import type {
  TRPCClientOutgoingMessage,
  TRPCErrorResponse,
  TRPCResultMessage,
} from "@trpc/server/rpc";

export type TRPCMessagePassingRequest = {
  trpc: TRPCClientOutgoingMessage;
};

export type TRPCMessagePassingSuccessResponse = {
  trpc: TRPCResultMessage<any>;
};

export type TRPCMessagePassingErrorResponse = {
  trpc: TRPCErrorResponse;
};

export type TRPCMessagePassingResponse =
  | TRPCMessagePassingSuccessResponse
  | TRPCMessagePassingErrorResponse;
