import { Controller, Implement, Implementer } from '@horn/orpc-hono'
import { planet } from '../../contracts/planet'
import { pub } from '../../libs/orpc/orpc'
import type { ORPCContext } from '../../libs/orpc/context'
import type {
  ListPlanetsInput,
  ListPlanetsOutput,
  GetPlanetInput,
  GetPlanetOutput,
  CreatePlanetInput,
  CreatePlanetOutput,
} from '../../schemas/planet'

@Controller()
@Implementer(pub)
export class PlanetController {
  @Implement(planet.list)
  list(input: ListPlanetsInput, context: ORPCContext): ListPlanetsOutput {
    console.log('list planets:', input)
    console.log('Full context:', context)

    // Test logger from hono context
    const logger = context.honoContext?.var?.logger
    if (logger) {
      logger.info('Logger is available from pinoLogger middleware!')
      logger.debug('Testing debug log', { input })
    } else {
      console.log('Logger not found in context.honoContext.var')
    }

    return {
      items: [],
      page: input.page || 0,
      pageSize: input.pageSize || 10,
      total: 0,
    }
  }

  @Implement(planet.get)
  get(input: GetPlanetInput): GetPlanetOutput {
    console.log('get planet:', input)
    return {
      id: input.id,
      name: 'Earth',
      type: 'terrestrial',
      hasLife: true,
      discoveredAt: new Date().toISOString(),
    }
  }

  @Implement(planet.create)
  create(input: CreatePlanetInput): CreatePlanetOutput {
    console.log('create planet:', input)
    return {
      id: Math.random().toString(36).substring(7),
      name: input.name,
      type: input.type,
      hasLife: input.hasLife || false,
      discoveredAt: new Date().toISOString(),
    }
  }
}