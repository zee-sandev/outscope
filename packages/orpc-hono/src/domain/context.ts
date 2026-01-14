import type { Context as HonoContext } from 'hono'

/**
 * Context types for oRPC-Hono framework
 */

/**
 * Base context type that all application contexts must extend.
 * Provides access to the underlying Hono context.
 */
export interface BaseORPCContext {
  /** The Hono context for accessing request/response */
  honoContext: HonoContext
}

/**
 * Authentication information for authenticated requests
 */
export interface AuthContext {
  /** Unique identifier for the authenticated user */
  userId: string
  /** User's email address */
  email?: string
  /** User's roles for authorization */
  roles?: string[]
  /** Additional authentication metadata */
  [key: string]: unknown
}

/**
 * Context type for authenticated requests.
 * Extends BaseORPCContext with authentication information.
 */
export interface AuthenticatedContext extends BaseORPCContext {
  /** Authentication information */
  auth: AuthContext
}

/**
 * Factory function type for creating request context.
 * Called for each incoming request to build the context object.
 *
 * @template TContext - The context type to create
 */
export type ContextFactory<TContext extends BaseORPCContext> = (params: {
  /** The Hono context for the current request */
  honoContext: HonoContext
}) => TContext | Promise<TContext>

/**
 * Default context factory that creates a basic context with just the Hono context.
 *
 * @param params - Parameters containing the Hono context
 * @returns A basic context object
 */
export const defaultContextFactory: ContextFactory<BaseORPCContext> = ({ honoContext }) => ({
  honoContext,
})
