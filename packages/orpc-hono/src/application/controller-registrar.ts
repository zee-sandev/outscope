import type { Hono } from 'hono'
import { RPCHandler } from '@orpc/server/fetch'
import { implement } from '@orpc/server'
import type { AnyContractRouter } from '@orpc/contract'
import type { RouteRegisterConfig, WithORPCMetadata } from '../domain/types'
import { NotAControllerError, MissingHandlerError } from '../domain/errors'
import { isController, getImplementations, getMiddleware, getMethodMiddleware } from '../infrastructure/decorators'
import { ContractResolver } from './contract-resolver'
import { InputExtractor } from './input-extractor'

/**
 * Service for registering controller classes with Hono
 *
 * Handles the complete controller registration process:
 * 1. Validate controller decorator
 * 2. Extract implementation metadata
 * 3. Create procedure handlers
 * 4. Register routes with Hono
 * 5. Build router structure
 */
export class ControllerRegistrar {
  private readonly config: RouteRegisterConfig
  private readonly contractResolver: ContractResolver
  private readonly inputExtractor: InputExtractor

  constructor(config: RouteRegisterConfig) {
    this.config = config
    this.contractResolver = new ContractResolver()
    this.inputExtractor = new InputExtractor()
  }

  /**
   * Register a controller instance with Hono
   *
   * @param app - Hono application
   * @param controller - Controller instance to register
   * @returns Router structure with registered procedures
   * @throws {NotAControllerError} If class is not decorated with @Controller()
   */
  async register(app: Hono, controller: unknown): Promise<AnyContractRouter> {
    // Validate controller
    const controllerClass = this.getControllerClass(controller)
    this.validateController(controllerClass)

    // Get implementations
    const implementations = getImplementations(controllerClass)

    if (implementations.length === 0) {
      return {} as AnyContractRouter
    }

    // Get class-level middleware if available
    const classMiddleware = getMiddleware(controllerClass)

    // Build router manually with procedures
    const router: AnyContractRouter = {} as AnyContractRouter

    for (const implementation of implementations) {
      const { contract, method, methodName } = implementation
      const boundMethod = method.bind(controller)

      // Get method-level middleware if available
      const methodMiddleware = getMethodMiddleware(controllerClass, methodName)

      // Resolve contract path
      const contractPath = this.config.contractRouter
        ? this.contractResolver.findContractPath(this.config.contractRouter, contract)
        : []

      // Create procedure with proper middleware handling
      const procedure = this.createProcedure(
        contract,
        boundMethod,
        contractPath,
        this.config.producer,
        classMiddleware,
        methodMiddleware
      )

      // Build router structure
      const structure = this.buildRouterStructure(contractPath, procedure, implementation.methodName)
      this.deepMerge(router as Record<string, unknown>, structure as Record<string, unknown>)
    }

    return router
  }


  /**
   * Create an oRPC procedure from contract and method
   *
   * @param contract - Contract procedure
   * @param boundMethod - Bound controller method
   * @param contractPath - Path to navigate within implementer
   * @param producer - Base producer/implementer
   * @param classMiddleware - Optional class-level middleware
   * @param methodMiddleware - Optional method-level middleware
   * @returns Procedure with handler
   */
  private createProcedure(
    contract: unknown,
    boundMethod: Function,
    contractPath: string[],
    producer?: unknown,
    classMiddleware?: unknown,
    methodMiddleware?: unknown
  ): WithORPCMetadata {
    // Start with base producer or create fresh implementer
    let baseImplementer: unknown = producer || implement(contract as AnyContractRouter)

    // Apply middleware to base implementer first
    let middlewareAppliedImplementer = baseImplementer

    // Apply class-level middleware if available
    if (classMiddleware && this.hasUseMethod(middlewareAppliedImplementer)) {
      middlewareAppliedImplementer = (middlewareAppliedImplementer as { use: (middleware: unknown) => unknown }).use(classMiddleware)
    }

    // Apply method-level middleware if available (takes precedence over class middleware)
    if (methodMiddleware && this.hasUseMethod(middlewareAppliedImplementer)) {
      middlewareAppliedImplementer = (middlewareAppliedImplementer as { use: (middleware: unknown) => unknown }).use(methodMiddleware)
    }

    // Navigate to the specific procedure in the middleware-applied implementer
    let finalImplementer: unknown
    if (contractPath.length > 0) {
      let current: any = middlewareAppliedImplementer
      for (const key of contractPath) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key]
        } else {
          throw new MissingHandlerError(`Contract path ${contractPath.join('.')} not found in middleware-applied implementer`)
        }
      }
      finalImplementer = current
    } else {
      // Try to find the procedure by contract reference
      const found = this.contractResolver.findProcedure(middlewareAppliedImplementer, contract)
      if (found) {
        finalImplementer = found
      } else {
        finalImplementer = middlewareAppliedImplementer
      }
    }

    // Validate that we have a valid implementer with handler method
    if (!this.hasHandlerMethod(finalImplementer)) {
      throw new MissingHandlerError(`No handler method found for contract at path: ${contractPath.join('.')}`)
    }

    // Create and return the procedure
    return (finalImplementer as { handler: (fn: Function) => WithORPCMetadata }).handler(
      ({ input, context }: { input: unknown; context: unknown }) => {
        const normalizedInput = this.inputExtractor.normalize(input)
        return boundMethod(normalizedInput, context)
      }
    )
  }

  /**
   * Build router structure matching contract structure
   *
   * @param contractPath - Path segments from contract
   * @param procedure - Procedure to register
   * @param methodName - Fallback key if no path
   * @returns Router structure
   */
  private buildRouterStructure(
    contractPath: string[],
    procedure: WithORPCMetadata,
    methodName: string | symbol
  ): AnyContractRouter {
    if (contractPath.length === 0) {
      // No path, use method name as key
      return { [String(methodName)]: procedure } as AnyContractRouter
    }

    // Build nested structure
    const router: Record<string, unknown> = {}
    let current = router

    // Create nested objects for path segments
    for (let i = 0; i < contractPath.length - 1; i++) {
      const key = contractPath[i]
      current[key] = {}
      current = current[key] as Record<string, unknown>
    }

    // Set procedure at final key
    const lastKey = contractPath[contractPath.length - 1]
    current[lastKey] = procedure

    return router as AnyContractRouter
  }

  /**
   * Get the class constructor from a controller instance
   *
   * @param controller - Controller instance
   * @returns Class constructor
   */
  private getControllerClass(controller: unknown): Function {
    if (typeof controller !== 'object' || controller === null) {
      throw new NotAControllerError(typeof controller)
    }

    return (controller as { constructor: Function }).constructor
  }

  /**
   * Validate that a class is a controller
   *
   * @param controllerClass - Class to validate
   * @throws {NotAControllerError} If not a controller
   */
  private validateController(controllerClass: Function): void {
    if (!isController(controllerClass)) {
      throw new NotAControllerError(controllerClass.name)
    }
  }

  /**
   * Type guard to check if implementer has handler method
   *
   * @param implementer - Implementer to check
   * @returns true if has handler method
   */
  private hasHandlerMethod(
    implementer: unknown
  ): implementer is { handler: (fn: Function) => WithORPCMetadata } {
    return (
      typeof implementer === 'object' &&
      implementer !== null &&
      'handler' in implementer &&
      typeof (implementer as { handler: unknown }).handler === 'function'
    )
  }

  /**
   * Type guard to check if implementer has use method
   *
   * @param implementer - Implementer to check
   * @returns true if has use method
   */
  private hasUseMethod(
    implementer: unknown
  ): implementer is { use: (middleware: unknown) => unknown } {
    if (typeof implementer !== 'object' || implementer === null) {
      return false
    }
    
    // Check if use method exists and is a function
    // Use try-catch to handle cases where use might be a getter/setter
    try {
      const useMethod = (implementer as { use: unknown }).use
      return typeof useMethod === 'function'
    } catch {
      return false
    }
  }


  /**
   * Deep merge source into target
   *
   * @param target - Target object
   * @param source - Source object
   */
  private deepMerge(target: Record<string, any>, source: Record<string, any>): void {
    for (const key in source) {
      if (typeof source[key] === 'object' && !('~orpc' in source[key])) {
        if (!target[key]) {
          target[key] = {}
        }
        this.deepMerge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }
}
