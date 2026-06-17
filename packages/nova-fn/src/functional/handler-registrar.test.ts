import { describe, expect, it } from 'vitest'
import { defineAccess } from '../domain/access.js'
import { defineHandlers, handle } from './define-handlers.js'
import { HandlerRegistrar } from './handler-registrar.js'

const listRoute = { id: 'list' }
const createRoute = { id: 'create' }
const routes = {
  planet: {
    list: listRoute,
    create: createRoute,
  },
} as any

function createProducer(route: unknown) {
  return {
    planet: {
      list: {
        handler(fn: Function) {
          return { '~orpc': { contract: route, handler: fn } }
        },
      },
      create: {
        handler(fn: Function) {
          return { '~orpc': { contract: route, handler: fn } }
        },
      },
    },
    use() {
      return this
    },
  }
}

describe('HandlerRegistrar', () => {
  it('binds handlers by route key and passes permission metadata into context', async () => {
    const handlers = {
      planet: defineHandlers(routes.planet, {
        list: handle.public(async (_input, context: any) => context.access),
        create: handle.permission('planet:create', (_input, context: any) => context.access),
      }),
    }

    const registrar = new HandlerRegistrar({
      routes,
      access: defineAccess({
        default: 'public',
        policies: {
          public: { producer: createProducer(listRoute) },
          permission: { producer: createProducer(createRoute) },
        },
      }),
    })

    const router = registrar.register(handlers) as any

    await expect(router.planet.list['~orpc'].handler({ input: {}, context: {} })).resolves.toEqual({
      policy: 'public',
    })
    await expect(router.planet.create['~orpc'].handler({ input: {}, context: {} })).resolves.toEqual({
      policy: 'permission',
      permissions: ['planet:create'],
    })
  })
})
