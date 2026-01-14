import { createORPCClient } from "@orpc/client";

import { link } from "./orpc.link";

const client = createORPCClient(link);

export const orpcClient = globalThis.$orpcClient ?? client;
