import type { PlanetType } from '@schemas/planet'
import { planetRepository } from './planet.repository'
import { logger } from '@libs/logger'
import type { Planet } from '@generated/prisma'

export type PaginatedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

type PlanetWithType = Omit<Planet, 'type'> & { type: PlanetType }

const serializePlanet = (planet: Planet): PlanetWithType => {
  return {
    ...planet,
    type: planet.type as PlanetType,
  }
}

export const planetService = {
  list: async (
    page = 0,
    pageSize = 10
  ): Promise<PaginatedResult<PlanetWithType>> => {
    const [items, total] = await Promise.all([
      planetRepository.list((page - 1) * pageSize, pageSize),
      planetRepository.count(),
    ])

    logger.debug({ page, pageSize, total }, 'Planet service: list')

    return { items: items.map(serializePlanet), page, pageSize, total }
  },

  getById: async (id: string): Promise<PlanetWithType> => {
    logger.debug({ id }, 'Planet service: getById')

    const planet = await planetRepository.findById(id)
    if (!planet) throw new Error(`Planet with id ${id} not found`)

    return serializePlanet(planet)
  },

  create: async (data: {
    name: string
    type: string
    hasLife?: boolean
  }): Promise<PlanetWithType> => {
    logger.info({ name: data.name, type: data.type }, 'Planet service: create')

    const existing = await planetRepository.findByName(data.name)
    if (existing)
      throw new Error(`Planet with name ${data.name} already exists`)

    const planet = await planetRepository.create(data)
    logger.info(
      { id: planet.id, name: planet.name },
      'Planet created successfully'
    )

    return serializePlanet(planet)
  },

  update: async (
    id: string,
    data: { name?: string; type?: string; hasLife?: boolean }
  ): Promise<PlanetWithType> => {
    logger.info({ id, data }, 'Planet service: update')

    const planet = await planetRepository.findById(id)
    if (!planet) throw new Error(`Planet with id ${id} not found`)

    if (data.name && data.name !== planet.name) {
      const existing = await planetRepository.findByName(data.name)
      if (existing)
        throw new Error(`Planet with name ${data.name} already exists`)
    }

    const updated = await planetRepository.update(id, data)
    logger.info({ id, name: updated.name }, 'Planet updated successfully')

    return serializePlanet(updated)
  },

  delete: async (id: string): Promise<void> => {
    logger.info({ id }, 'Planet service: delete')

    const planet = await planetRepository.findById(id)
    if (!planet) throw new Error(`Planet with id ${id} not found`)

    await planetRepository.delete(id)
    logger.info({ id, name: planet.name }, 'Planet deleted successfully')
  },
} as const
