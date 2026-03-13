import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "@workspace/contracts";

declare global {
  var $orpcClient: ContractRouterClient<typeof contract>;
}

export {};
