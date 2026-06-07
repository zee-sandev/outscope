/**
 * Access policy primitives for Nova 2.0.
 */

export type AccessProducerFactory = (metadata: AccessMetadata) => unknown

export interface AccessMetadata {
  policy: string
  permissions?: string[]
}

export interface AccessPolicy {
  producer: unknown | AccessProducerFactory
}

export interface AccessConfig {
  default: string
  policies: Record<string, AccessPolicy>
}

export interface EndpointAccessMetadata {
  policy?: string
  permissions?: string[]
}

export interface ResolvedAccessPolicy {
  metadata: AccessMetadata
  policy: AccessPolicy
  producer: unknown
}

export class MissingAccessPolicyError extends Error {
  constructor(policyName: string) {
    super(`Access policy "${policyName}" is not declared in access.policies`)
    this.name = 'MissingAccessPolicyError'
  }
}

export function defineAccess<TConfig extends AccessConfig>(config: TConfig): TConfig {
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

  return {
    metadata,
    policy,
    producer:
      typeof policy.producer === 'function'
        ? (policy.producer as AccessProducerFactory)(metadata)
        : policy.producer,
  }
}

export function createAccessMiddleware(metadata: AccessMetadata): unknown {
  return ({ next, context }: { next: (params: { context: unknown }) => unknown; context: unknown }) =>
    next({
      context: {
        ...(typeof context === 'object' && context !== null ? context : {}),
        access: metadata,
      },
    })
}
