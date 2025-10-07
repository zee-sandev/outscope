import type { Hono } from 'hono'
import type { AnyContractRouter } from '@orpc/contract'
import type { ORPCHonoOptions, ApplyMiddlewareOptions, HonoMiddleware } from '../domain/types'
import { ControllerRegistrar } from '../application/controller-registrar'

/**
 * Main class for integrating oRPC with Hono framework
 *
 * Provides a clean, decorator-based API for building type-safe APIs with oRPC and Hono.
 * Follows clean architecture principles with clear separation of concerns.
 *
 * Features:
 * - Decorator-based controller registration
 * - Type-safe contract implementation
 * - Global middleware support
 * - Automatic path resolution
 * - REST and oRPC-style routing
 *
 * @example
 * ```typescript
 * import { ORPCHono } from '@horn/orpc-hono'
 * import { Hono } from 'hono'
 * import { contract } from './contracts'
 * import { UserController } from './controllers/user'
 *
 * const app = new Hono()
 * const orpcHono = new ORPCHono({
 *   prefix: '/api',
 *   contract,
 * })
 *
 * const router = await orpcHono.applyMiddleware(app, {
 *   controllers: [new UserController()],
 * })
 * ```
 */
export class ORPCHono<TContract extends AnyContractRouter = AnyContractRouter> {
  private readonly prefix: string
  private readonly interceptors: HonoMiddleware[]
  private readonly contract?: TContract

  /**
   * Create a new ORPCHono instance
   *
   * @param options - Configuration options
   * @param options.prefix - URL prefix for all routes (default: '')
   * @param options.interceptors - Global middleware functions (default: [])
   * @param options.contract - Root contract router for path resolution
   */
  constructor(options: ORPCHonoOptions<TContract> = {}) {
    this.prefix = options.prefix ?? ''
    this.interceptors = options.interceptors ?? []
    this.contract = options.contract
  }

  /**
   * Apply middleware and register controllers with Hono
   *
   * This is the main entry point for setting up your API.
   * It will:
   * 1. Apply global interceptors
   * 2. Register all controllers
   * 3. Return a router structure matching your contracts
   *
   * @param app - Hono application instance
   * @param options - Registration options
   * @param options.controllers - Controller instances to register
   * @returns Router structure with registered procedures
   *
   * @example
   * ```typescript
   * const router = await orpcHono.applyMiddleware(app, {
   *   controllers: [
   *     new UserController(),
   *     new PostController(),
   *   ],
   * })
   * ```
   */
  async applyMiddleware(
    app: Hono,
    options: ApplyMiddlewareOptions = {}
  ): Promise<any> {
    // Apply global interceptors
    this.applyInterceptors(app)

    // Register controllers
    const router = await this.registerControllers(app, options.controllers ?? [])

    return router
  }

  /**
   * Apply global interceptors to Hono app
   *
   * @param app - Hono application
   */
  private applyInterceptors(app: Hono): void {
    for (const interceptor of this.interceptors) {
      app.use('*', interceptor)
    }
  }

  /**
   * Register all controllers with Hono
   *
   * @param app - Hono application
   * @param controllers - Controller instances to register
   * @returns Merged router structure
   */
  private async registerControllers(
    app: Hono,
    controllers: unknown[]
  ): Promise<AnyContractRouter> {
    const registrar = new ControllerRegistrar({
      prefix: this.prefix,
      contractRouter: this.contract,
    })

    const router: AnyContractRouter = {} as AnyContractRouter

    for (const controller of controllers) {
      const controllerRouter = await registrar.register(app, controller)
      // Deep merge controller router into main router
      this.mergeRouters(router as Record<string, unknown>, controllerRouter as Record<string, unknown>)
    }

    return router
  }

  /**
   * Deep merge two router structures
   *
   * @param target - Target router to merge into
   * @param source - Source router to merge from
   */
  private mergeRouters(target: Record<string, unknown>, source: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(source)) {
      if (key in target && this.isPlainObject(target[key]) && this.isPlainObject(value)) {
        // Both are objects, merge recursively
        this.mergeRouters(target[key] as Record<string, unknown>, value as Record<string, unknown>)
      } else {
        // Not both objects, or key doesn't exist, overwrite
        target[key] = value
      }
    }
  }

  /**
   * Check if a value is a plain object
   *
   * @param value - Value to check
   * @returns true if plain object
   */
  private isPlainObject(value: unknown): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  /**
   * Get the configured URL prefix
   *
   * @returns The URL prefix
   */
  getPrefix(): string {
    return this.prefix
  }

  /**
   * Get the configured contract router
   *
   * @returns The contract router if configured
   */
  getContract(): TContract | undefined {
    return this.contract
  }

  /**
   * Get the configured interceptors
   *
   * @returns Array of interceptor middleware
   */
  getInterceptors(): HonoMiddleware[] {
    return [...this.interceptors]
  }
}
