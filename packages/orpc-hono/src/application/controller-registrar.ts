import type { Hono } from 'hono'
import { implement } from '@orpc/server'
import type { AnyContractRouter } from '@orpc/contract'
import type { WithORPCMetadata } from '../domain/types'
import { NotAControllerError, MissingHandlerError } from '../domain/errors'
import { isController, getImplementations, getImplementer } from '../infrastructure/decorators'
import { RouteRegistrar, type RouteRegistrarConfig } from './route-registrar'
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
  private readonly routeRegistrar: RouteRegistrar
  private readonly contractResolver: ContractResolver
  private readonly inputExtractor: InputExtractor

  constructor(config: RouteRegistrarConfig) {
    this.contractResolver = new ContractResolver()
    this.inputExtractor = new InputExtractor()
    this.routeRegistrar = new RouteRegistrar(config)
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
      console.warn(`Controller ${controllerClass.name} has no @Implement() decorated methods`)
      return {} as AnyContractRouter
    }

    // Get class-level implementer if available
    const classImplementer = getImplementer(controllerClass)

    // Build handlers object for router
    const handlers: Record<string, any> = {}

    for (const implementation of implementations) {
      const { contract, method } = implementation
      const boundMethod = method.bind(controller)

      // Create procedure
      const procedure = this.createProcedure(contract, boundMethod, classImplementer)

      // Register routes with Hono
      const contractPath = this.routeRegistrar.resolveContractPath(contract)
      this.routeRegistrar.register(app, contract, procedure, contractPath)

      // Build handlers structure
      this.addHandlerToStructure(handlers, contractPath, boundMethod, implementation.methodName)
    }

    // If we have a class implementer with router method, use it
    if (this.hasRouterMethod(classImplementer)) {
      return (classImplementer as any).router(handlers)
    }

    // Fallback: build router manually with procedures
    const router: AnyContractRouter = {} as AnyContractRouter
    for (const implementation of implementations) {
      const { contract, method } = implementation
      const boundMethod = method.bind(controller)
      const procedure = this.createProcedure(contract, boundMethod, classImplementer)
      const contractPath = this.routeRegistrar.resolveContractPath(contract)
      const structure = this.buildRouterStructure(contractPath, procedure, implementation.methodName)
      this.deepMerge(router as any, structure as any)
    }

    return router
  }

  /**
   * Add handler to nested structure
   *
   * @param handlers - Handlers object to build
   * @param contractPath - Path segments
   * @param handler - Handler function
   * @param methodName - Fallback method name
   */
  private addHandlerToStructure(
    handlers: Record<string, any>,
    contractPath: string[],
    handler: Function,
    methodName: string | symbol
  ): void {
    if (contractPath.length === 0) {
      handlers[String(methodName)] = handler
      return
    }

    let current = handlers
    for (let i = 0; i < contractPath.length - 1; i++) {
      const key = contractPath[i]
      if (!current[key]) {
        current[key] = {}
      }
      current = current[key]
    }

    const lastKey = contractPath[contractPath.length - 1]
    current[lastKey] = handler
  }

  /**
   * Create an oRPC procedure from contract and method
   *
   * @param contract - Contract procedure
   * @param boundMethod - Bound controller method
   * @param classImplementer - Optional class-level implementer
   * @returns Procedure with handler
   */
  private createProcedure(
    contract: unknown,
    boundMethod: Function,
    classImplementer?: unknown
  ): WithORPCMetadata {
    // Try to find existing procedure in class implementer
    let procedureImplementer: unknown

    if (classImplementer) {
      const existing = this.contractResolver.findProcedure(classImplementer, contract)
      procedureImplementer = existing ?? implement(contract as AnyContractRouter)
    } else {
      procedureImplementer = implement(contract as AnyContractRouter)
    }

    // Validate implementer has handler method
    if (!this.hasHandlerMethod(procedureImplementer)) {
      throw new MissingHandlerError(typeof procedureImplementer)
    }

    // Create procedure with normalized input handling
    return procedureImplementer.handler(({ input, context }: { input: unknown; context: unknown }) => {
      const normalizedInput = this.inputExtractor.normalize(input)
      return boundMethod(normalizedInput, context)
    })
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
   * Type guard to check if implementer has router method
   *
   * @param implementer - Implementer to check
   * @returns true if has router method
   */
  private hasRouterMethod(
    implementer: unknown
  ): implementer is { router: (handlers: Record<string, any>) => AnyContractRouter } {
    return (
      typeof implementer === 'object' &&
      implementer !== null &&
      'router' in implementer &&
      typeof (implementer as { router: unknown }).router === 'function'
    )
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
