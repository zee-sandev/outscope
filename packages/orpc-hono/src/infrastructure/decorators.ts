import type { ImplementationMetadata } from '../domain/types'
import {
  markAsController,
  addImplementation,
  isController,
  getImplementations,
  setMiddleware,
  getMiddleware,
  setMethodMiddleware,
  getMethodMiddleware,
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
// Implementer decorator removed

/**
 * Applies middleware chain to controller or method
 *
 * Can be used as a class decorator to apply middleware to all methods in the controller,
 * or as a method decorator to apply middleware to a specific method.
 *
 * The middleware will be applied to the base implementer before creating procedures.
 * This allows you to use middleware chains like `authed` that include authentication,
 * authorization, or other cross-cutting concerns.
 *
 * The middleware must have access to the contract structure and can be created
 * using the `.use()` method on an implementer.
 *
 * @param middleware - The middleware chain to apply
 *
 * @example Class-level middleware
 * ```typescript
 * const pub = implement(contract).$context<MyContext>()
 * const authed = pub.use(authMiddleware)
 *
 * @Controller()
 * @Middleware(authed)
 * class UserController {
 *   @Implement(contract.user.getCurrentUser)
 *   getCurrentUser({ context }: { context: MyContext & { user: User } }) {
 *     return context.user // user is now available from authed middleware
 *   }
 * }
 * ```
 *
 * @example Method-level middleware
 * ```typescript
 * const pub = implement(contract).$context<MyContext>()
 * const authed = pub.use(authMiddleware)
 *
 * @Controller()
 * class UserController {
 *   @Middleware(authed)
 *   @Implement(contract.user.getCurrentUser)
 *   getCurrentUser({ context }: { context: MyContext & { user: User } }) {
 *     return context.user // user is now available from authed middleware
 *   }
 *
 *   @Implement(contract.user.getPublicProfile)
 *   getPublicProfile({ input }: { input: { id: string } }) {
 *     // This method doesn't use authed middleware
 *     return { id: input.id, name: 'Public User' }
 *   }
 * }
 * ```
 */
export function Middleware<T>(middleware: T): ClassDecorator & MethodDecorator {
  return ((target: Function | Object, propertyKey?: string | symbol) => {
    // Class decorator
    if (typeof target === 'function') {
      setMiddleware(target, middleware)
    }
    // Method decorator
    else if (propertyKey !== undefined) {
      setMethodMiddleware(target, propertyKey, middleware)
    }
  }) as ClassDecorator & MethodDecorator
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
export { isController, getImplementations, getMiddleware, getMethodMiddleware }
