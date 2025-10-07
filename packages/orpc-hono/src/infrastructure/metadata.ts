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
  IMPLEMENTER: Symbol('orpc:implementer'),
  IMPLEMENTATIONS: Symbol('orpc:implementations'),
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
export function setImplementer<T>(target: Function, implementer: T): void {
  Reflect.defineMetadata(METADATA_KEYS.IMPLEMENTER, implementer, target)
}

/**
 * Retrieve the implementer instance for a controller class
 *
 * @param target - The class constructor
 * @returns The implementer instance if available
 */
export function getImplementer<T = unknown>(target: Function): T | undefined {
  return Reflect.getMetadata(METADATA_KEYS.IMPLEMENTER, target) as T | undefined
}

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
 * Clear all metadata from a class (useful for testing)
 *
 * @param target - The class constructor
 */
export function clearMetadata(target: Function): void {
  Object.values(METADATA_KEYS).forEach((key) => {
    Reflect.deleteMetadata(key, target)
  })
}
