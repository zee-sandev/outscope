/**
 * Access policy primitives for Nova 2.0.
 */

export type AccessProducerFactory = (metadata: AccessMetadata) => unknown
export type AccessMiddlewareFactory = (metadata: AccessMetadata) => unknown
export type AccessPolicyKind = 'plain' | 'permission'

export interface AccessMetadata {
  policy: string
  permissions?: string[]
}

export interface AccessPolicy {
  kind?: AccessPolicyKind
  producer?: unknown | AccessProducerFactory
  uses?: string | string[]
  middleware?: unknown | AccessMiddlewareFactory
  middlewares?: Array<unknown | AccessMiddlewareFactory>
}

export interface AccessConfig<
  TPolicies extends Record<string, AccessPolicy> = Record<string, AccessPolicy>,
> {
  default: string
  policies: TPolicies
}

export interface EndpointAccessMetadata {
  policy?: string
  permissions?: string[]
}

export interface ResolvedAccessPolicy {
  metadata: AccessMetadata
  policy: AccessPolicy
  producer: unknown
  middlewares: unknown[]
}

export class MissingAccessPolicyError extends Error {
  constructor(policyName: string) {
    super(`Access policy "${policyName}" is not declared in access.policies`)
    this.name = 'MissingAccessPolicyError'
  }
}

export class AccessPolicyCycleError extends Error {
  constructor(path: string[]) {
    super(`Access policy cycle detected: ${path.join(' -> ')}`)
    this.name = 'AccessPolicyCycleError'
  }
}

export function defineAccess<TConfig extends AccessConfig>(
  config: TConfig & AccessConfig,
): TConfig {
  return config
}

export function resolveAccessPolicy(
  endpoint: EndpointAccessMetadata | undefined,
  access: AccessConfig,
): ResolvedAccessPolicy {
  const policyName = endpoint?.policy ?? access.default
  const policy = access.policies[policyName]

  if (!policy) {
    throw new MissingAccessPolicyError(policyName)
  }

  const metadata: AccessMetadata = {
    policy: policyName,
    permissions: endpoint?.permissions,
  }

  const composition = composePolicy(policyName, access, metadata)

  return {
    metadata,
    policy,
    producer: composition.producer,
    middlewares: composition.middlewares,
  }
}

export function createAccessMiddleware(metadata: AccessMetadata): unknown {
  return ({
    next,
    context,
  }: {
    next: (params: { context: unknown }) => unknown
    context: unknown
  }) =>
    next({
      context: {
        ...(typeof context === 'object' && context !== null ? context : {}),
        access: metadata,
      },
    })
}

function composePolicy(
  policyName: string,
  access: AccessConfig,
  metadata: AccessMetadata,
): { producer: unknown; middlewares: unknown[] } {
  const chain = buildPolicyChain(policyName, access)
  let producer: unknown
  const pendingMiddlewares: unknown[] = []

  for (const name of chain) {
    const policy = access.policies[name]

    if (policy.producer !== undefined) {
      producer = resolveProducer(policy.producer, metadata)
      producer = applyMiddlewares(producer, pendingMiddlewares)
      pendingMiddlewares.length = 0
    }

    for (const middleware of normalizeMiddlewares(policy)) {
      const resolved = resolveMiddleware(middleware, metadata)
      if (hasUseMethod(producer)) {
        producer = producer.use(resolved)
      } else {
        pendingMiddlewares.push(resolved)
      }
    }
  }

  return {
    producer,
    middlewares: pendingMiddlewares,
  }
}

function buildPolicyChain(policyName: string, access: AccessConfig): string[] {
  const chain: string[] = []
  const added = new Set<string>()

  visit(policyName, [])
  return chain

  function visit(name: string, stack: string[]): void {
    if (stack.includes(name)) {
      throw new AccessPolicyCycleError([...stack, name])
    }

    const policy = access.policies[name]
    if (!policy) {
      throw new MissingAccessPolicyError(name)
    }

    for (const parent of normalizeUses(policy.uses)) {
      visit(parent, [...stack, name])
    }

    if (!added.has(name)) {
      chain.push(name)
      added.add(name)
    }
  }
}

function normalizeUses(uses: string | string[] | undefined): string[] {
  if (!uses) return []
  return Array.isArray(uses) ? uses : [uses]
}

function normalizeMiddlewares(
  policy: AccessPolicy,
): Array<unknown | AccessMiddlewareFactory> {
  return [
    ...(policy.middleware === undefined ? [] : [policy.middleware]),
    ...(policy.middlewares ?? []),
  ]
}

function resolveProducer(
  producer: unknown | AccessProducerFactory,
  metadata: AccessMetadata,
): unknown {
  return typeof producer === 'function'
    ? (producer as AccessProducerFactory)(metadata)
    : producer
}

function resolveMiddleware(
  middleware: unknown | AccessMiddlewareFactory,
  metadata: AccessMetadata,
): unknown {
  if (typeof middleware !== 'function') {
    return middleware
  }

  return isMiddlewareFactory(middleware)
    ? (middleware as AccessMiddlewareFactory)(metadata)
    : middleware
}

function isMiddlewareFactory(middleware: Function): boolean {
  const source = Function.prototype.toString.call(middleware).trim()
  const arrowIndex = source.indexOf('=>')
  const signature =
    arrowIndex >= 0
      ? source.slice(0, arrowIndex)
      : source.slice(0, source.indexOf('{'))
  return !signature.includes('{') && !signature.includes('[')
}

function applyMiddlewares(producer: unknown, middlewares: unknown[]): unknown {
  let current: unknown = producer
  for (const middleware of middlewares) {
    if (!hasUseMethod(current)) return current
    current = current.use(middleware)
  }
  return current
}

function hasUseMethod(
  value: unknown,
): value is { use: (middleware: unknown) => unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'use' in value &&
    typeof (value as { use: unknown }).use === 'function'
  )
}
