import 'reflect-metadata'
import { describe, expect, it } from 'vitest'
import { ControllerRegistrar } from './controller-registrar'
import { Auth, Controller, Handle, Permission, Public } from '../infrastructure/decorators'
import { defineAccess } from '../domain/access'

const publicRoute = { id: 'public' }
const authRoute = { id: 'auth' }
const permissionRoute = { id: 'permission' }

function createProducer(route: unknown) {
  const procedure = {
    handler(fn: Function) {
      return {
        '~orpc': {
          contract: route,
          handler: fn,
        },
      }
    },
  }

  return {
    endpoint: procedure,
    nested: {
      auth: procedure,
      permission: procedure,
    },
    use() {
      return this
    },
  }
}

describe('ControllerRegistrar access policies', () => {
  it('selects public, auth, and permission producers from access metadata', async () => {
    @Controller()
    class TestController {
      @Public()
      @Handle(publicRoute)
      list(_input: unknown, context: any) {
        return context.access
      }

      @Auth()
      @Handle(authRoute)
      me(_input: unknown, context: any) {
        return context.access
      }

      @Permission('planet:create')
      @Handle(permissionRoute)
      create(_input: unknown, context: any) {
        return context.access
      }
    }

    const registrar = new ControllerRegistrar({
      routes: {
        endpoint: publicRoute,
        nested: {
          auth: authRoute,
          permission: permissionRoute,
        },
      } as any,
      access: defineAccess({
        default: 'public',
        policies: {
          public: { producer: createProducer(publicRoute) },
          auth: { producer: createProducer(authRoute) },
          permission: { producer: createProducer(permissionRoute) },
        },
      }),
    })

    const router = await registrar.register({} as any, new TestController()) as any

    expect(router.endpoint['~orpc'].handler({ input: {}, context: {} })).toEqual({
      policy: 'public',
    })
    expect(router.nested.auth['~orpc'].handler({ input: {}, context: {} })).toEqual({
      policy: 'auth',
    })
    expect(router.nested.permission['~orpc'].handler({ input: {}, context: {} })).toEqual({
      policy: 'permission',
      permissions: ['planet:create'],
    })
  })

  it('throws a clear error when an endpoint references an undeclared access policy', async () => {
    @Controller()
    class TestController {
      @Permission('planet:create')
      @Handle(permissionRoute)
      create() {
        return {}
      }
    }

    const registrar = new ControllerRegistrar({
      routes: { endpoint: permissionRoute } as any,
      access: defineAccess({
        default: 'public',
        policies: {
          public: { producer: createProducer(publicRoute) },
        },
      }),
    })

    await expect(registrar.register({} as any, new TestController())).rejects.toThrow(
      'Access policy "permission" is not declared in access.policies',
    )
  })
})
