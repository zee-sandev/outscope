import { describe, expect, it } from 'vitest'
import {
  AccessPolicyCycleError,
  MissingAccessPolicyError,
  defineAccess,
  resolveAccessPolicy,
} from '../domain/access.js'
import { defineHandle, defineHandlers, handle } from './define-handlers.js'
import { HandlerRegistrar } from './handler-registrar.js'

const listRoute = { id: 'list' }
const createRoute = { id: 'create' }
const routes = {
  planet: {
    list: listRoute,
    create: createRoute,
  },
} as any

function createProducer(route: unknown, appliedMiddlewares: unknown[] = []) {
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
    use(middleware: unknown) {
      appliedMiddlewares.push(middleware)
      return this
    },
  }
}

describe('HandlerRegistrar', () => {
  it('binds handlers by route key and passes permission metadata into context', async () => {
    const handlers = {
      planet: defineHandlers(routes.planet, {
        list: handle.public(async (_input, context: any) => context.access),
        create: handle.permission(
          'planet:create',
          (_input, context: any) => context.access,
        ),
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

    await expect(
      router.planet.list['~orpc'].handler({ input: {}, context: {} }),
    ).resolves.toEqual({
      policy: 'public',
    })
    await expect(
      router.planet.create['~orpc'].handler({ input: {}, context: {} }),
    ).resolves.toEqual({
      policy: 'permission',
      permissions: ['planet:create'],
    })
  })

  it('binds composed access policy middlewares in parent-before-child order', () => {
    const appliedMiddlewares: unknown[] = []

    const policy = resolveAccessPolicy(
      { policy: 'adminPermission', permissions: ['tenant:inspect'] },
      defineAccess({
        default: 'public',
        policies: {
          public: {
            kind: 'plain',
            producer: createProducer(listRoute, appliedMiddlewares),
          },
          auth: {
            kind: 'plain',
            uses: 'public',
            middleware: 'auth',
          },
          acoreStaff: {
            kind: 'plain',
            uses: ['auth'],
            middlewares: ['staff'],
          },
          adminPermission: {
            kind: 'permission',
            uses: 'acoreStaff',
            middleware: (metadata) =>
              `permission:${metadata.permissions?.join(',')}`,
          },
        },
      }),
    )

    expect(policy.metadata).toEqual({
      policy: 'adminPermission',
      permissions: ['tenant:inspect'],
    })
    expect(policy.producer).toBeDefined()
    expect(appliedMiddlewares).toEqual([
      'auth',
      'staff',
      'permission:tenant:inspect',
    ])
  })

  it('supports producer(metadata) backward compatibility', () => {
    const producer = createProducer(createRoute)

    const policy = resolveAccessPolicy(
      { policy: 'permission', permissions: ['planet:create'] },
      defineAccess({
        default: 'public',
        policies: {
          public: { producer: createProducer(listRoute) },
          permission: {
            producer: (metadata) => {
              expect(metadata).toEqual({
                policy: 'permission',
                permissions: ['planet:create'],
              })
              return producer
            },
          },
        },
      }),
    )

    expect(policy.producer).toBe(producer)
  })

  it('throws a clear error when a parent policy is missing', () => {
    expect(() =>
      resolveAccessPolicy(
        { policy: 'staff' },
        defineAccess({
          default: 'public',
          policies: {
            public: { producer: createProducer(listRoute) },
            staff: { kind: 'plain', uses: 'auth', middleware: 'staff' },
          },
        }),
      ),
    ).toThrow(MissingAccessPolicyError)
  })

  it('throws a clear error when policy composition contains a cycle', () => {
    expect(() =>
      resolveAccessPolicy(
        { policy: 'auth' },
        defineAccess({
          default: 'public',
          policies: {
            public: { producer: createProducer(listRoute) },
            auth: { kind: 'plain', uses: 'staff', middleware: 'auth' },
            staff: { kind: 'plain', uses: 'auth', middleware: 'staff' },
          },
        }),
      ),
    ).toThrow(AccessPolicyCycleError)
  })

  it('keeps the existing missing-policy behavior for unknown endpoint policies', () => {
    expect(() =>
      resolveAccessPolicy(
        { policy: 'unknown' },
        defineAccess({
          default: 'public',
          policies: {
            public: { producer: createProducer(listRoute) },
          },
        }),
      ),
    ).toThrow(MissingAccessPolicyError)
  })
})

describe('defineHandle', () => {
  it('creates plain policy helpers from kind: plain', () => {
    const typedHandle = defineHandle(
      defineAccess({
        default: 'public',
        policies: {
          public: { kind: 'plain', producer: createProducer(listRoute) },
          auth: { kind: 'plain', uses: 'public', middleware: 'auth' },
        },
      }),
    )

    expect(typedHandle.public(async () => 'ok').access).toEqual({
      policy: 'public',
    })
    expect(typedHandle.auth(async () => 'ok').access).toEqual({
      policy: 'auth',
    })
  })

  it('creates permission policy helpers from kind: permission', () => {
    const typedHandle = defineHandle(
      defineAccess({
        default: 'public',
        policies: {
          public: { kind: 'plain', producer: createProducer(listRoute) },
          adminPermission: {
            kind: 'permission',
            uses: 'public',
            middleware: (metadata) =>
              `permission:${metadata.permissions?.join(',')}`,
          },
        },
      }),
    )

    expect(
      typedHandle.adminPermission('tenant:inspect', async () => 'ok').access,
    ).toEqual({
      policy: 'adminPermission',
      permissions: ['tenant:inspect'],
    })
  })

  it('supports curried and array permission helpers', () => {
    const typedHandle = defineHandle(
      defineAccess({
        default: 'public',
        policies: {
          public: { producer: createProducer(listRoute) },
          permission: {
            kind: 'permission',
            uses: 'public',
            middleware: 'permission',
          },
        },
      }),
    )

    const curried = typedHandle.permission(['task:create', 'task:update'])(
      async () => 'ok',
    )

    expect(curried.access).toEqual({
      policy: 'permission',
      permissions: ['task:create', 'task:update'],
    })
  })

  it('infers omitted kind as plain except for the compatibility permission policy', () => {
    const typedHandle = defineHandle(
      defineAccess({
        default: 'public',
        policies: {
          public: { producer: createProducer(listRoute) },
          permission: { producer: createProducer(createRoute) },
        },
      }),
    )

    expect(typedHandle.public(async () => 'ok').access).toEqual({
      policy: 'public',
    })
    expect(
      typedHandle.permission('task:create', async () => 'ok').access,
    ).toEqual({
      policy: 'permission',
      permissions: ['task:create'],
    })
  })

  it('keeps existing global handle helpers working', () => {
    expect(handle.public(async () => 'ok').access).toEqual({
      policy: 'public',
    })
    expect(handle.auth(async () => 'ok').access).toEqual({ policy: 'auth' })
    expect(handle.permission('task:create', async () => 'ok').access).toEqual({
      policy: 'permission',
      permissions: ['task:create'],
    })
    expect(handle.custom('staff')(async () => 'ok').access).toEqual({
      policy: 'staff',
    })
  })
})
