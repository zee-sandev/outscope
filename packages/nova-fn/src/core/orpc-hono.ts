import type { Hono } from 'hono'
import type { AnyContractRouter } from '@orpc/contract'
import type { ORPCHonoOptions, HonoMiddleware } from '../domain/types.js'
import type { HandlerMap } from '../functional/define-handlers.js'
import { HandlerRegistrar } from '../functional/handler-registrar.js'

/**
 * Options for applying handlers to Hono
 */
export interface ApplyHandlersOptions {
  /** Handler map to register */
  handlers: HandlerMap
}

/**
 * Main class for integrating oRPC with Hono framework (lite/functional version).
 *
 * Uses pure function handlers instead of decorator-based controllers.
 * No reflect-metadata required.
 */
export class ORPCHono<TContract extends AnyContractRouter = AnyContractRouter> {
  private readonly interceptors: HonoMiddleware[]
  private readonly routes?: TContract
  private readonly access: ORPCHonoOptions<TContract>['access']

  constructor(options: ORPCHonoOptions<TContract>) {
    this.interceptors = options.interceptors ?? []
    this.routes = options.routes
    this.access = options.access
  }

  /**
   * Apply handlers and register them with Hono
   *
   * @param app - Hono application instance
   * @param options - Operations to register
   * @returns Router structure with registered procedures
   */
  async applyHandlers(
    app: Hono,
    options: ApplyHandlersOptions,
  ): Promise<any> {
    // Apply global interceptors
    this.applyInterceptors(app)

    // Register handlers
    const registrar = new HandlerRegistrar({
      routes: this.routes as AnyContractRouter,
      access: this.access,
    })

    return registrar.register(options.handlers)
  }

  private applyInterceptors(app: Hono): void {
    for (const interceptor of this.interceptors) {
      app.use('*', interceptor)
    }
  }

  getContract(): TContract | undefined {
    return this.routes
  }

  getInterceptors(): HonoMiddleware[] {
    return [...this.interceptors]
  }

  getProducer(): unknown {
    return undefined
  }
}
