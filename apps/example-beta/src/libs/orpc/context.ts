import type { Context as HonoContext } from "hono";

export type User = {
  id: string
  name: string
  email: string
  role: string
}

export type ORPCContext = {
  user?: User
  honoContext: HonoContext
}

export async function createContext({ honoContext }: { honoContext: HonoContext }) {
  // No user in initial context - will be added by middleware if authenticated
  return {
    user: undefined,
    honoContext: honoContext,
  };
}


export type Context = Awaited<ReturnType<typeof createContext>>;