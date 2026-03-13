import { cors } from 'hono/cors'
import type { Plugin, PluginFactory } from './types'
import type { BaseORPCContext } from '../domain/context'

/**
 * CORS plugin options
 */
export interface CORSPluginOptions {
  /**
   * Allowed origins. Can be a string, array of strings, or function.
   * @default '*'
   */
  origins?: string | string[] | ((origin: string) => boolean)

  /**
   * Allow credentials (cookies, authorization headers)
   * @default false
   */
  credentials?: boolean

  /**
   * Allowed HTTP methods
   * @default ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH']
   */
  allowMethods?: string[]

  /**
   * Allowed headers
   */
  allowHeaders?: string[]

  /**
   * Headers exposed to the client
   */
  exposeHeaders?: string[]

  /**
   * Max age for preflight cache (seconds)
   */
  maxAge?: number
}

/**
 * Create a CORS plugin for handling Cross-Origin Resource Sharing.
 *
 * @param options - CORS configuration options
 * @returns A plugin that adds CORS middleware
 *
 * @example
 * ```typescript
 * const app = await createApp({
 *   contract,
 *   controllers: [...],
 *   plugins: [
 *     corsPlugin({
 *       origins: ['http://localhost:3000', 'https://myapp.com'],
 *       credentials: true,
 *     }),
 *   ],
 * })
 * ```
 */
export const corsPlugin: PluginFactory<CORSPluginOptions, BaseORPCContext> = (options) => {
  const { origins = '*', credentials = false, allowMethods, allowHeaders, exposeHeaders, maxAge } = options

  // Normalize origins to the format expected by hono/cors
  let origin: string | string[] | ((origin: string, c: any) => string | undefined | null)

  if (typeof origins === 'function') {
    origin = (o: string) => (origins(o) ? o : undefined)
  } else if (Array.isArray(origins)) {
    origin = origins
  } else {
    origin = origins
  }

  return {
    name: 'cors',

    onInit({ app }) {
      app.use(
        '/*',
        cors({
          origin,
          credentials,
          allowMethods,
          allowHeaders,
          exposeHeaders,
          maxAge,
        })
      )
    },
  }
}

export type { Plugin as CORSPlugin }
