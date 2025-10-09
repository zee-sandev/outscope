import 'reflect-metadata'
import type { ImplementationMetadata } from '../domain/types'

/**
 * Infrastructure layer for managing reflection metadata
 *
 * This module provides type-safe operations for storing and retrieving
 * decorator metadata using the reflect-metadata library.
 */

/**
 * Metadata keys for storing decorator information
 */
const METADATA_KEYS = {
  CONTROLLER: Symbol('orpc:controller'),
  IMPLEMENTATIONS: Symbol('orpc:implementations'),
  MIDDLEWARE: Symbol('orpc:middleware'),
  METHOD_MIDDLEWARE: Symbol('orpc:method-middleware'),
} as const

/**
 * Mark a class as an oRPC controller
 *
 * @param target - The class constructor to mark
 */
export function markAsController(target: Function): void {
  Reflect.defineMetadata(METADATA_KEYS.CONTROLLER, true, target)
}

/**
 * Check if a class is marked as an oRPC controller
 *
 * @param target - The class constructor to check
 * @returns true if the class is a controller
 */
export function isController(target: Function): boolean {
  return Reflect.getMetadata(METADATA_KEYS.CONTROLLER, target) === true
}

/**
 * Store an implementer instance for a controller class
 *
 * @param target - The class constructor
 * @param implementer - The implementer instance to store
 */
// Implementer metadata removed

/**
 * Retrieve the implementer instance for a controller class
 *
 * @param target - The class constructor
 * @returns The implementer instance if available
 */
// Implementer metadata removed

/**
 * Add an implementation to a controller class
 *
 * @param target - The class constructor
 * @param implementation - The implementation metadata to add
 */
export function addImplementation(target: Function, implementation: ImplementationMetadata): void {
  const existing = getImplementations(target)
  const updated = [...existing, implementation]
  Reflect.defineMetadata(METADATA_KEYS.IMPLEMENTATIONS, updated, target)
}

/**
 * Get all implementations from a controller class
 *
 * @param target - The class constructor
 * @returns Array of implementation metadata
 */
export function getImplementations(target: Function): ImplementationMetadata[] {
  return Reflect.getMetadata(METADATA_KEYS.IMPLEMENTATIONS, target) ?? []
}

/**
 * Check if a controller has any implementations
 *
 * @param target - The class constructor
 * @returns true if the controller has at least one implementation
 */
export function hasImplementations(target: Function): boolean {
  return getImplementations(target).length > 0
}

/**
 * Store middleware for a controller class
 *
 * @param target - The class constructor
 * @param middleware - The middleware to store
 */
export function setMiddleware<T>(target: Function, middleware: T): void {
  Reflect.defineMetadata(METADATA_KEYS.MIDDLEWARE, middleware, target)
}

/**
 * Retrieve the middleware for a controller class
 *
 * @param target - The class constructor
 * @returns The middleware if available
 */
export function getMiddleware<T = unknown>(target: Function): T | undefined {
  return Reflect.getMetadata(METADATA_KEYS.MIDDLEWARE, target) as T | undefined
}

/**
 * Store middleware for a specific method in a controller class
 *
 * @param target - The class prototype
 * @param methodName - The method name
 * @param middleware - The middleware to store
 */
export function setMethodMiddleware<T>(
  target: Object,
  methodName: string | symbol,
  middleware: T
): void {
  // Get constructor from target (which is the prototype)
  const constructor = (target as any).constructor
  const existing = getMethodMiddlewares(constructor)
  const updated = { ...existing, [methodName]: middleware }
  Reflect.defineMetadata(METADATA_KEYS.METHOD_MIDDLEWARE, updated, constructor)
}

/**
 * Retrieve middleware for a specific method in a controller class
 *
 * @param target - The class constructor
 * @param methodName - The method name
 * @returns The middleware if available
 */
export function getMethodMiddleware<T = unknown>(
  target: Function,
  methodName: string | symbol
): T | undefined {
  const middlewares = getMethodMiddlewares(target)
  return middlewares?.[methodName] as T | undefined
}

/**
 * Get all method middlewares from a controller class
 *
 * @param target - The class constructor
 * @returns Map of method names to middleware
 */
export function getMethodMiddlewares(target: Function): Record<string | symbol, unknown> {
  return Reflect.getMetadata(METADATA_KEYS.METHOD_MIDDLEWARE, target) ?? {}
}

/**
 * Clear all metadata from a class (useful for testing)
 *
 * @param target - The class constructor
 */
export function clearMetadata(target: Function): void {
  Object.values(METADATA_KEYS).forEach((key) => {
    Reflect.deleteMetadata(key, target)
  })
}
