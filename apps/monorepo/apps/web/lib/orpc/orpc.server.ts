import "server-only";

import { createORPCClient } from "@orpc/client";

import { link } from "./orpc.link";

import type { ContractRouterClient } from "@orpc/contract";
import type { contract } from "api/contracts";

globalThis.$orpcClient =
  createORPCClient<ContractRouterClient<typeof contract>>(link);
