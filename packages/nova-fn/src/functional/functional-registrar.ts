import type { AnyContractRouter } from '@orpc/contract'
import { implement } from '@orpc/server'
import type { OperationDef, OperationMap } from './define-operations'
import type { RouteRegisterConfig, WithORPCMetadata } from '../domain/types'
import { MissingHandlerError } from '../domain/errors'
import { ContractResolver } from '../application/contract-resolver'
import { InputExtractor } from '../application/input-extractor'
import { normalizeError } from '../domain/errors'

/**
 * Registers operation maps as oRPC router procedures.
 * Replaces ControllerRegistrar for the functional approach.
 */
export class FunctionalRegistrar {
  private readonly config: RouteRegisterConfig
  private readonly contractResolver: ContractResolver
  private readonly inputExtractor: InputExtractor

  constructor(config: RouteRegisterConfig) {
    this.config = config
    this.contractResolver = new ContractResolver()
    this.inputExtractor = new InputExtractor()
  }

  /**
   * Register all operations from an OperationMap into a router.
   */
  register(operations: OperationMap): AnyContractRouter {
    const router: Record<string, unknown> = {}

    this.walkOperations(operations, [], router)

    return router as AnyContractRouter
  }

  /**
   * Recursively walk the operation map and register each OperationDef
   */
  private walkOperations(
    map: Record<string, OperationDef | Record<string, OperationDef>>,
    parentPath: string[],
    router: Record<string, unknown>,
  ): void {
    for (const [key, value] of Object.entries(map)) {
      if (this.isOperationDef(value)) {
        this.registerOperation(value, router)
      } else {
        // Nested module — recurse
        this.walkOperations(
          value as Record<string, OperationDef>,
          [...parentPath, key],
          router,
        )
      }
    }
  }

  /**
   * Register a single OperationDef as a procedure in the router
   */
  private registerOperation(
    opDef: OperationDef,
    router: Record<string, unknown>,
  ): void {
    const { contract, handler, middlewares, catchErrors } = opDef

    // Resolve contract path within the contract router
    const contractPath = this.config.contractRouter
      ? this.contractResolver.findContractPath(this.config.contractRouter, contract)
      : []

    // Start with base producer or create fresh implementer
    let implementer: unknown = this.config.producer || implement(contract as AnyContractRouter)

    // Apply middlewares
    for (const middleware of middlewares) {
      if (this.hasUseMethod(implementer)) {
        implementer = (implementer as { use: (m: unknown) => unknown }).use(middleware)
      }
    }

    // Navigate to the specific procedure
    let finalImplementer: unknown
    if (contractPath.length > 0) {
      let current: any = implementer
      for (const pathKey of contractPath) {
        if (current && typeof current === 'object' && pathKey in current) {
          current = current[pathKey]
        } else {
          throw new MissingHandlerError(
            `Contract path ${contractPath.join('.')} not found in implementer`,
          )
        }
      }
      finalImplementer = current
    } else {
      const found = this.contractResolver.findProcedure(implementer, contract)
      finalImplementer = found || implementer
    }

    // Validate handler method exists
    if (!this.hasHandlerMethod(finalImplementer)) {
      throw new MissingHandlerError(
        `No handler method found for contract at path: ${contractPath.join('.')}`,
      )
    }

    // Create procedure
    const wrappedHandler = catchErrors
      ? this.wrapWithErrorHandling(handler)
      : handler

    const procedure = (
      finalImplementer as { handler: (fn: Function) => WithORPCMetadata }
    ).handler(({ input, context }: { input: unknown; context: unknown }) => {
      const normalizedInput = this.inputExtractor.normalize(input)
      return wrappedHandler(normalizedInput, context)
    })

    // Build nested router structure and merge
    const structure = this.buildRouterStructure(contractPath, procedure)
    this.deepMerge(router, structure)
  }

  /**
   * Wrap a handler with error normalization
   */
  private wrapWithErrorHandling(
    handler: (input: any, context: any) => Promise<any>,
  ): (input: any, context: any) => Promise<any> {
    return async (input: any, context: any) => {
      try {
        return await handler(input, context)
      } catch (error) {
        throw normalizeError(error)
      }
    }
  }

  /**
   * Build a nested router structure from a contract path
   */
  private buildRouterStructure(
    contractPath: string[],
    procedure: WithORPCMetadata,
  ): Record<string, unknown> {
    if (contractPath.length === 0) {
      return {}
    }

    const result: Record<string, unknown> = {}
    let current = result

    for (let i = 0; i < contractPath.length - 1; i++) {
      current[contractPath[i]] = {}
      current = current[contractPath[i]] as Record<string, unknown>
    }

    current[contractPath[contractPath.length - 1]] = procedure

    return result
  }

  /**
   * Deep merge source into target
   */
  private deepMerge(
    target: Record<string, any>,
    source: Record<string, any>,
  ): void {
    for (const key in source) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !('~orpc' in source[key])
      ) {
        if (!target[key]) {
          target[key] = {}
        }
        this.deepMerge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }

  private hasHandlerMethod(
    implementer: unknown,
  ): implementer is { handler: (fn: Function) => WithORPCMetadata } {
    return (
      typeof implementer === 'object' &&
      implementer !== null &&
      'handler' in implementer &&
      typeof (implementer as { handler: unknown }).handler === 'function'
    )
  }

  private hasUseMethod(
    implementer: unknown,
  ): implementer is { use: (middleware: unknown) => unknown } {
    if (typeof implementer !== 'object' || implementer === null) {
      return false
    }
    try {
      return typeof (implementer as { use: unknown }).use === 'function'
    } catch {
      return false
    }
  }

  private isOperationDef(value: unknown): value is OperationDef {
    return (
      typeof value === 'object' &&
      value !== null &&
      'contract' in value &&
      'handler' in value &&
      'middlewares' in value &&
      typeof (value as OperationDef).handler === 'function'
    )
  }
}
