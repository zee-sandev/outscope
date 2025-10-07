import type { ImplementationMetadata } from '../domain/types'
import {
  markAsController,
  setImplementer,
  addImplementation,
  isController,
  getImplementer,
  getImplementations,
} from './metadata'

/**
 * Application decorators for oRPC-Hono integration
 *
 * Provides class and method decorators for defining controllers and
 * mapping controller methods to oRPC contracts.
 */

/**
 * Marks a class as an oRPC controller
 *
 * Controllers contain methods decorated with @Implement() that define API endpoints.
 * This decorator is required for a class to be registered with ORPCHono.
 *
 * @example
 * ```typescript
 * @Controller()
 * class UserController {
 *   @Implement(getUserContract)
 *   getUser(input: { id: string }) {
 *     return { id: input.id, name: 'John' }
 *   }
 * }
 * ```
 */
export function Controller(): ClassDecorator {
  return (target: Function) => {
    markAsController(target)
  }
}

/**
 * Provides an implementer instance for the controller
 *
 * Methods decorated with @Implement() will use this implementer instead of creating a new one.
 * This allows sharing middleware and context across all procedures in the controller.
 *
 * The implementer must be created using the `implement()` function from @orpc/server and
 * should be configured with any necessary middleware and context types.
 *
 * @param implementer - The implementer created from implement(contract)
 *
 * @example
 * ```typescript
 * const pub = implement(contract).$context<MyContext>()
 *
 * @Controller()
 * @Implementer(pub)
 * class UserController {
 *   @Implement(contract.user.get)
 *   getUser(input: { id: string }, context: MyContext) {
 *     return { id: input.id, name: 'John' }
 *   }
 * }
 * ```
 */
export function Implementer<T>(implementer: T): ClassDecorator {
  return (target: Function) => {
    setImplementer(target, implementer)
  }
}

/**
 * Marks a method as implementing an oRPC contract
 *
 * The decorated method becomes the handler for the specified contract.
 * The method receives the validated input and context as parameters.
 *
 * The method signature should match:
 * - First parameter: Input type from the contract
 * - Second parameter (optional): Context type
 * - Return type: Output type from the contract
 *
 * @param contract - The oRPC contract procedure to implement
 *
 * @example
 * ```typescript
 * @Controller()
 * class UserController {
 *   @Implement(getUserContract)
 *   getUser(input: { id: string }, context: MyContext) {
 *     return { id: input.id, name: 'John' }
 *   }
 * }
 * ```
 */
export function Implement<TInput = unknown, TOutput = unknown, TContext = unknown>(
  contract: unknown
): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor | void => {
    const implementation: ImplementationMetadata<TInput, TOutput, TContext> = {
      contract: contract as ImplementationMetadata<TInput, TOutput, TContext>['contract'],
      methodName: propertyKey,
      method: descriptor.value,
    }

    addImplementation(target.constructor, implementation)

    return descriptor
  }
}

// Re-export metadata accessors for public API
export { isController, getImplementer, getImplementations }
