import { z } from 'zod'

// ============================================================================
// Core Entity Schemas
// ============================================================================

/**
 * User entity schema
 * Represents a complete user object with all properties
 */
export const User = z
  .object({
    id: z.string().describe('Unique identifier for the user'),
    name: z.string().min(1).describe('Name of the user'),
    email: z.string().email().describe('Email address of the user'),
    role: z.string().describe('Role of the user'),
  })
  .describe('User object')

// ============================================================================
// Get Current User Schemas
// ============================================================================

export const GetCurrentUserInput = z
  .object({})
  .describe('Input parameters for getting current user (empty object)')

export const GetCurrentUserOutput = User

// ============================================================================
// Type Exports
// ============================================================================

export type User = z.infer<typeof User>
export type GetCurrentUserInput = z.infer<typeof GetCurrentUserInput>
export type GetCurrentUserOutput = z.infer<typeof GetCurrentUserOutput>
