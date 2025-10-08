import { prisma } from '@libs/prisma'
import type { Planet, Prisma } from '@generated/prisma'

export type PlanetCreateData = Prisma.PlanetCreateInput
export type PlanetUpdateData = Prisma.PlanetUpdateInput

export const planetRepository = {
  list: async (skip = 0, take = 10): Promise<Planet[]> =>
    prisma.planet.findMany({
      skip: skip,
      take: take,
      orderBy: { createdAt: 'desc' },
    }),

  count: async (): Promise<number> => prisma.planet.count(),

  findById: async (id: string): Promise<Planet | null> =>
    prisma.planet.findUnique({ where: { id } }),

  findByName: async (name: string): Promise<Planet | null> =>
    prisma.planet.findUnique({ where: { name } }),

  create: async (data: PlanetCreateData): Promise<Planet> =>
    prisma.planet.create({ data }),

  update: async (id: string, data: PlanetUpdateData): Promise<Planet> =>
    prisma.planet.update({ where: { id }, data }),

  delete: async (id: string): Promise<Planet> =>
    prisma.planet.delete({ where: { id } }),
} as const
