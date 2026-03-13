import type { AnyContractRouter } from '@orpc/contract'
import type { WithORPCMetadata } from '../domain/types'
import { hasORPCMetadata } from '../domain/types'

/**
 * Service for resolving contract paths and procedures within a contract router
 *
 * Provides utilities for traversing contract router structures and finding
 * specific contracts or procedures.
 */
export class ContractResolver {
  /**
   * Find the path to a contract within a router structure
   *
   * Performs a depth-first search through the router object tree to find
   * the specified contract and returns the path as an array of keys.
   *
   * @param router - Root contract router to search
   * @param targetContract - Contract to find
   * @returns Array of keys representing the path, or empty array if not found
   *
   * @example
   * ```typescript
   * const resolver = new ContractResolver()
   * const path = resolver.findContractPath(router, contract.user.get)
   * // Returns: ['user', 'get']
   * ```
   */
  findContractPath(router: AnyContractRouter, targetContract: unknown): string[] {
    return this.searchContractPath(router, targetContract, [])
  }

  /**
   * Recursively search for a contract in the router structure
   *
   * @param current - Current node in the router tree
   * @param target - Target contract to find
   * @param currentPath - Current path from root
   * @returns Path to target, or empty array if not found
   */
  private searchContractPath(current: unknown, target: unknown, currentPath: string[]): string[] {
    // Direct match
    if (current === target) {
      return currentPath
    }

    // Only traverse objects
    if (!this.isTraversable(current)) {
      return []
    }

    // Search through all properties
    for (const key of Object.keys(current)) {
      // Skip special keys
      if (this.shouldSkipKey(key)) {
        continue
      }

      const value = (current as Record<string, unknown>)[key]
      const result = this.searchContractPath(value, target, [...currentPath, key])

      if (result.length > 0) {
        return result
      }
    }

    return []
  }

  /**
   * Find a procedure implementation within an implementer structure
   *
   * Searches through the implementer object tree to find the procedure
   * that implements the specified contract.
   *
   * @param implementer - Root implementer to search
   * @param targetContract - Contract to find implementation for
   * @returns The procedure with oRPC metadata, or null if not found
   */
  findProcedure(implementer: unknown, targetContract: unknown): WithORPCMetadata | null {
    // Check if current node is the target procedure
    if (hasORPCMetadata(implementer)) {
      const contract = implementer['~orpc'].contract
      if (contract === targetContract) {
        return implementer
      }
    }

    // Only traverse objects
    if (!this.isTraversable(implementer)) {
      return null
    }

    // Search through all properties
    for (const key of Object.keys(implementer)) {
      // Skip special keys
      if (this.shouldSkipKey(key)) {
        continue
      }

      const value = (implementer as Record<string, unknown>)[key]
      const result = this.findProcedure(value, targetContract)

      if (result !== null) {
        return result
      }
    }

    return null
  }

  /**
   * Check if a value can be traversed (is an object)
   *
   * @param value - Value to check
   * @returns true if value is a non-null object
   */
  private isTraversable(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  /**
   * Check if a key should be skipped during traversal
   *
   * Skips:
   * - Keys starting with '~' (metadata)
   * - Keys starting with '$' (special methods)
   * - Function values
   *
   * @param key - Property key to check
   * @returns true if key should be skipped
   */
  private shouldSkipKey(key: string): boolean {
    return key.startsWith('~') || key.startsWith('$')
  }
}
