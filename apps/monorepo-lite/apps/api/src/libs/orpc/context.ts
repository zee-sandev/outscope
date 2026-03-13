import type { Context as HonoContext } from 'hono'
import type { BaseORPCContext } from '@outscope/nova-fn'

export interface ORPCContext extends BaseORPCContext {
  headers?: Headers
  auth?: {
    userId: string
    tenantId: string
    email: string
  }
}

export type AuthedORPCContext = ORPCContext & {
  auth: {
    userId: string
    tenantId: string
    email: string
  }
}

export async function createContext({
  honoContext,
}: {
  honoContext: HonoContext
}): Promise<ORPCContext> {
  return {
    honoContext,
    headers: honoContext.req.raw.headers,
  }
}
