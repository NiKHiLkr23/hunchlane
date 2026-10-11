import { AsyncLocalStorage } from "node:async_hooks";

export type OperationContext = {
  owner: string;
  revision: number;
  lease: string;
};
export const operationContext = new AsyncLocalStorage<OperationContext>();
