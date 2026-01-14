import type { Context as HonoContext } from 'hono'
import type { BaseORPCContext } from '@outscope/orpc-hono'

export type User = {
  id: string
  name: string
  email: string
  role: string
}

export interface ORPCContext extends BaseORPCContext {
  user?: User
}

export async function createContext({ honoContext }: { honoContext: HonoContext }): Promise<ORPCContext> {
  // No user in initial context - will be added by middleware if authenticated
  return {
    user: undefined,
    honoContext,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
