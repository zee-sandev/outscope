import type { Hono } from 'hono'
import type { AnyContractRouter } from '@orpc/contract'
import type { ORPCHonoOptions, HonoMiddleware } from '../domain/types'
import type { OperationMap } from '../functional/define-operations'
import { FunctionalRegistrar } from '../functional/functional-registrar'

/**
 * Options for applying operations to Hono
 */
export interface ApplyOperationsOptions {
  /** Operation map to register */
  operations: OperationMap
}

/**
 * Main class for integrating oRPC with Hono framework (lite/functional version).
 *
 * Uses pure function operations instead of decorator-based controllers.
 * No reflect-metadata required.
 */
export class ORPCHono<TContract extends AnyContractRouter = AnyContractRouter> {
  private readonly interceptors: HonoMiddleware[]
  private readonly contract?: TContract
  private readonly producer?: unknown

  constructor(options: ORPCHonoOptions<TContract> = {}) {
    this.interceptors = options.interceptors ?? []
    this.contract = options.contract
    this.producer = options.producer
  }

  /**
   * Apply operations and register them with Hono
   *
   * @param app - Hono application instance
   * @param options - Operations to register
   * @returns Router structure with registered procedures
   */
  async applyOperations(
    app: Hono,
    options: ApplyOperationsOptions,
  ): Promise<any> {
    // Apply global interceptors
    this.applyInterceptors(app)

    // Register operations
    const registrar = new FunctionalRegistrar({
      contractRouter: this.contract as AnyContractRouter,
      producer: this.producer,
    })

    return registrar.register(options.operations)
  }

  private applyInterceptors(app: Hono): void {
    for (const interceptor of this.interceptors) {
      app.use('*', interceptor)
    }
  }

  getContract(): TContract | undefined {
    return this.contract
  }

  getInterceptors(): HonoMiddleware[] {
    return [...this.interceptors]
  }

  getProducer(): unknown {
    return this.producer
  }
}
