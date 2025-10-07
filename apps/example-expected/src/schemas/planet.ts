import { z } from 'zod'

// ============================================================================
// Enums & Constants
// ============================================================================

export const PlanetType = z.enum(['terrestrial', 'gas_giant', 'ice_giant', 'dwarf'])

// ============================================================================
// Core Entity Schemas
// ============================================================================

/**
 * Planet entity schema
 * Represents a complete planet object with all properties
 */
export const Planet = z
  .object({
    id: z.string().describe('Unique identifier for the planet'),
    name: z.string().min(1).describe('Name of the planet'),
    type: PlanetType.describe('Type of planet'),
    hasLife: z.boolean().optional().describe('Whether the planet has life'),
    discoveredAt: z.string().describe('ISO date string when planet was discovered'),
  })
  .describe('Planet object')

// ============================================================================
// List Planets Schemas
// ============================================================================

export const ListPlanetsInput = z
  .object({
    page: z.number().int().min(1).default(1).describe('Page number for pagination'),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(10)
      .describe('Number of items per page'),
    search: z.string().optional().describe('Search term to filter planets by name'),
  })
  .describe('Input parameters for listing planets')

export const ListPlanetsOutput = z
  .object({
    items: z.array(Planet).describe('Array of planets'),
    page: z.number().int().describe('Current page number'),
    pageSize: z.number().int().describe('Number of items per page'),
    total: z.number().int().describe('Total number of planets'),
  })
  .describe('Paginated list of planets')

// ============================================================================
// Get Planet Schemas
// ============================================================================

export const GetPlanetInput = z
  .object({
    id: z.string().describe('Planet ID to retrieve'),
  })
  .describe('Input parameters for getting a single planet')

export const GetPlanetOutput = Planet

// ============================================================================
// Create Planet Schemas
// ============================================================================

export const CreatePlanetInput = z
  .object({
    name: z.string().min(1).max(100).describe('Name of the planet'),
    type: PlanetType.describe('Type of planet'),
    hasLife: z.boolean().optional().describe('Whether the planet has life'),
  })
  .describe('Input parameters for creating a new planet')

export const CreatePlanetOutput = Planet

// ============================================================================
// Type Exports
// ============================================================================

export type PlanetType = z.infer<typeof PlanetType>
export type Planet = z.infer<typeof Planet>
export type ListPlanetsInput = z.infer<typeof ListPlanetsInput>
export type ListPlanetsOutput = z.infer<typeof ListPlanetsOutput>
export type GetPlanetInput = z.infer<typeof GetPlanetInput>
export type GetPlanetOutput = z.infer<typeof GetPlanetOutput>
export type CreatePlanetInput = z.infer<typeof CreatePlanetInput>
export type CreatePlanetOutput = z.infer<typeof CreatePlanetOutput>
