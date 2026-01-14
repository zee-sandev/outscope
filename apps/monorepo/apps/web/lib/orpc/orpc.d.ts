import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "api/contracts";

declare global {
  var $orpcClient: ContractRouterClient<typeof contract>;
}

export {};
