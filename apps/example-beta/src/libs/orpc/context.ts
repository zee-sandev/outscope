import type { Context as HonoContext } from "hono";

export type ORPCContext = {
  // user?: z.infer<typeof UserSchema>
  honoContext: HonoContext
}

export async function createContext({ honoContext }: ORPCContext) {
  // No auth configured
  return {
    honoContext: honoContext,
  };
}


export type Context = Awaited<ReturnType<typeof createContext>>;