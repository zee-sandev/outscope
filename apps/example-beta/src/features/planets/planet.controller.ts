import { Controller, Implement, Implementer } from '@horn/orpc-hono'
import { planet } from '@contracts/planet'
import { pub } from '@libs/orpc/orpc'
import { planetService } from './planet.service'
import type { ORPCContext } from '@libs/orpc/context'
import type {
  ListPlanetsInput,
  ListPlanetsOutput,
  GetPlanetInput,
  GetPlanetOutput,
  CreatePlanetInput,
  CreatePlanetOutput,
} from '@schemas/planet'

@Controller()
@Implementer(pub)
export class PlanetController {
  @Implement(planet.list)
  async list(input: ListPlanetsInput, context: ORPCContext): Promise<ListPlanetsOutput> {
    const result = await planetService.list(input.page, input.pageSize)

    return {
      items: result.items.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        hasLife: p.hasLife,
        discoveredAt: p.discoveredAt.toISOString(),
      })),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    }
  }

  @Implement(planet.get)
  async get(input: GetPlanetInput, context: ORPCContext): Promise<GetPlanetOutput> {
    const p = await planetService.getById(input.id)

    return {
      id: p.id,
      name: p.name,
      type: p.type,
      hasLife: p.hasLife,
      discoveredAt: p.discoveredAt.toISOString(),
    }
  }

  @Implement(planet.create)
  async create(input: CreatePlanetInput, context: ORPCContext): Promise<CreatePlanetOutput> {
    const p = await planetService.create(input)

    return {
      id: p.id,
      name: p.name,
      type: p.type,
      hasLife: p.hasLife,
      discoveredAt: p.discoveredAt.toISOString(),
    }
  }
}