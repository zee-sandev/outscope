import { Controller, Implement, Middleware } from '@outscope/orpc-hono'
import { planet } from '@contracts/planet'
import { pub, authMiddleware } from '@libs/orpc/orpc'
import { planetService } from './planet.service'
import type { ORPCContext, User } from '@libs/orpc/context'
import type {
  ListPlanetsInput,
  ListPlanetsOutput,
  GetPlanetInput,
  GetPlanetOutput,
  CreatePlanetInput,
  CreatePlanetOutput,
} from '@schemas/planet'

@Controller()
export class PlanetController {
  // Public endpoint - no authentication required
  @Implement(planet.list)
  async list(input: ListPlanetsInput, context: ORPCContext): Promise<ListPlanetsOutput> {
    console.log('=== PlanetController.list (public) ===')
    console.log('Context:', context)
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

  // Public endpoint - no authentication required
  @Implement(planet.get)
  async get(input: GetPlanetInput, context: ORPCContext): Promise<GetPlanetOutput> {
    console.log('=== PlanetController.get (public) ===')
    const p = await planetService.getById(input.id)

    return {
      id: p.id,
      name: p.name,
      type: p.type,
      hasLife: p.hasLife,
      discoveredAt: p.discoveredAt.toISOString(),
    }
  }

  // Protected endpoint - requires authentication via method-level middleware
  @Middleware(authMiddleware)
  @Implement(planet.create)
  async create(input: CreatePlanetInput, context: ORPCContext & { user: User }): Promise<CreatePlanetOutput> {
    console.log('=== PlanetController.create (protected) ===')
    console.log('Created by user:', context.user.name)
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