import {
  ListPlanetsInput,
  ListPlanetsOutput,
  GetPlanetInput,
  GetPlanetOutput,
  CreatePlanetInput,
  CreatePlanetOutput,
} from '../schemas/planet'
import { oc } from '@orpc/contract'
// Very lightweight contract shape tailored to @outscope/orpc-hono expectations
// Each procedure includes a route with method and path, plus optional meta

export const list = oc
  .route({
    method: 'POST',
    path: '/planets',
    summary: 'List all planets',
    description: 'Retrieve a paginated list of planets with optional search filter',
    tags: ['Planets'],
    deprecated: false,
  })
  .input(ListPlanetsInput)
  .output(ListPlanetsOutput)

export const get = oc
  .route({
    method: 'GET',
    path: '/planets/:id',
    summary: 'Get planet by ID',
    description: 'Retrieve detailed information about a specific planet',
    tags: ['Planets'],
    deprecated: false,
  })
  .input(GetPlanetInput)
  .output(GetPlanetOutput)

export const create = oc
  .route({
    method: 'POST',
    path: '/planets/create',
    summary: 'Create a new planet',
    description: 'Add a new planet to the system',
    tags: ['Planets'],
    deprecated: false,
  })
  .input(CreatePlanetInput)
  .output(CreatePlanetOutput)

export const planet = {
  list,
  get,
  create,
}