import type { AnyContractProcedure, AnyContractRouter } from '@orpc/contract'
import type {
  AccessConfig,
  AccessMetadata,
  AccessPolicy,
} from '../domain/access.js'

export interface HandlerDef<TInput = any, TOutput = any, TContext = any> {
  readonly handler: (input: TInput, context: TContext) => Promise<TOutput>
  readonly access: AccessMetadata
  readonly middlewares: readonly unknown[]
  readonly catchErrors: boolean
}

export type HandlerMap = Record<string, HandlerDef | Record<string, HandlerDef>>
type MaybePromise<T> = T | Promise<T>

class HandlerBuilder<TInput, TOutput, TContext> {
  private readonly _handler: (
    input: TInput,
    context: TContext,
  ) => Promise<TOutput>
  private readonly _access: AccessMetadata
  private readonly _middlewares: readonly unknown[]
  private readonly _catchErrors: boolean

  constructor(
    access: AccessMetadata,
    handler: (input: TInput, context: TContext) => Promise<TOutput>,
    middlewares: readonly unknown[] = [],
    catchErrors = false,
  ) {
    this._access = access
    this._handler = handler
    this._middlewares = middlewares
    this._catchErrors = catchErrors
  }

  use(middleware: unknown): HandlerBuilder<TInput, TOutput, TContext> {
    return new HandlerBuilder(
      this._access,
      this._handler,
      [...this._middlewares, middleware],
      this._catchErrors,
    )
  }

  catch(): HandlerBuilder<TInput, TOutput, TContext> {
    return new HandlerBuilder(
      this._access,
      this._handler,
      this._middlewares,
      true,
    )
  }

  build(): HandlerDef<TInput, TOutput, TContext> {
    return {
      handler: this._handler,
      access: this._access,
      middlewares: this._middlewares,
      catchErrors: this._catchErrors,
    }
  }
}

function createHandler<TInput, TOutput, TContext>(
  access: AccessMetadata,
  handler: (input: TInput, context: TContext) => MaybePromise<TOutput>,
): HandlerDef<TInput, TOutput, TContext> {
  return new HandlerBuilder<TInput, TOutput, TContext>(
    access,
    async (input, context) => handler(input, context),
  )
    .catch()
    .build()
}

function permission<TInput, TOutput, TContext>(
  permission: string | string[],
  handler: (input: TInput, context: TContext) => MaybePromise<TOutput>,
): HandlerDef<TInput, TOutput, TContext>
function permission<TInput, TOutput, TContext>(
  permission: string | string[],
): (
  handler: (input: TInput, context: TContext) => MaybePromise<TOutput>,
) => HandlerDef<TInput, TOutput, TContext>
function permission<TInput, TOutput, TContext>(
  permission: string | string[],
  handler?: (input: TInput, context: TContext) => MaybePromise<TOutput>,
) {
  const access = {
    policy: 'permission',
    permissions: Array.isArray(permission) ? permission : [permission],
  }

  if (handler) {
    return createHandler(access, handler)
  }

  return (
    nextHandler: (input: TInput, context: TContext) => MaybePromise<TOutput>,
  ): HandlerDef<TInput, TOutput, TContext> => createHandler(access, nextHandler)
}

type HandlerFunction<TInput, TOutput, TContext> = (
  input: TInput,
  context: TContext,
) => MaybePromise<TOutput>

export interface PlainHandle<PolicyName extends string = string> {
  <TInput, TOutput, TContext>(
    handler: HandlerFunction<TInput, TOutput, TContext>,
  ): HandlerDef<TInput, TOutput, TContext>
}

export interface PermissionHandle<PolicyName extends string = string> {
  <TInput, TOutput, TContext>(
    permission: string | string[],
    handler: HandlerFunction<TInput, TOutput, TContext>,
  ): HandlerDef<TInput, TOutput, TContext>
  <TInput, TOutput, TContext>(
    permission: string | string[],
  ): (
    handler: HandlerFunction<TInput, TOutput, TContext>,
  ) => HandlerDef<TInput, TOutput, TContext>
}

type PolicyKind<
  TPolicy extends AccessPolicy,
  TName extends string,
> = TPolicy extends { kind: 'permission' }
  ? 'permission'
  : TName extends 'permission'
    ? 'permission'
    : 'plain'

export type DefinedHandle<TAccess extends AccessConfig> = {
  [TName in Extract<keyof TAccess['policies'], string>]: PolicyKind<
    TAccess['policies'][TName],
    TName
  > extends 'permission'
    ? PermissionHandle<TName>
    : PlainHandle<TName>
}

export const handle = {
  public<TInput, TOutput, TContext>(
    handler: (input: TInput, context: TContext) => MaybePromise<TOutput>,
  ): HandlerDef<TInput, TOutput, TContext> {
    return createHandler({ policy: 'public' }, handler)
  },

  auth<TInput, TOutput, TContext>(
    handler: (input: TInput, context: TContext) => MaybePromise<TOutput>,
  ): HandlerDef<TInput, TOutput, TContext> {
    return createHandler({ policy: 'auth' }, handler)
  },

  permission,

  custom(policy: string) {
    return <TInput, TOutput, TContext>(
      handler: (input: TInput, context: TContext) => MaybePromise<TOutput>,
    ): HandlerDef<TInput, TOutput, TContext> =>
      createHandler({ policy }, handler)
  },
}

export function defineHandle<TAccess extends AccessConfig>(
  access: TAccess,
): DefinedHandle<TAccess> {
  const helpers: Record<string, unknown> = {}

  for (const [policyName, policy] of Object.entries(access.policies)) {
    helpers[policyName] =
      inferPolicyKind(policyName, policy) === 'permission'
        ? createPermissionHandle(policyName)
        : createPlainHandle(policyName)
  }

  return helpers as DefinedHandle<TAccess>
}

function createPlainHandle(policyName: string): PlainHandle {
  return ((handler: HandlerFunction<unknown, unknown, unknown>) =>
    createHandler({ policy: policyName }, handler)) as PlainHandle
}

function createPermissionHandle(policyName: string): PermissionHandle {
  function helper<TInput, TOutput, TContext>(
    permission: string | string[],
    handler: HandlerFunction<TInput, TOutput, TContext>,
  ): HandlerDef<TInput, TOutput, TContext>
  function helper<TInput, TOutput, TContext>(
    permission: string | string[],
  ): (
    handler: HandlerFunction<TInput, TOutput, TContext>,
  ) => HandlerDef<TInput, TOutput, TContext>
  function helper<TInput, TOutput, TContext>(
    permission: string | string[],
    handler?: HandlerFunction<TInput, TOutput, TContext>,
  ) {
    const access = {
      policy: policyName,
      permissions: Array.isArray(permission) ? permission : [permission],
    }

    if (handler) {
      return createHandler(access, handler)
    }

    return (nextHandler: HandlerFunction<TInput, TOutput, TContext>) =>
      createHandler(access, nextHandler)
  }

  return helper as PermissionHandle
}

function inferPolicyKind(
  policyName: string,
  policy: AccessPolicy,
): 'plain' | 'permission' {
  return policy.kind ?? (policyName === 'permission' ? 'permission' : 'plain')
}

export function defineHandlers<TRoutes, THandlers extends HandlerMap>(
  _routes: TRoutes,
  handlers: THandlers,
): THandlers {
  return handlers
}

export function isRouteProcedure(
  value: unknown,
): value is AnyContractProcedure {
  return typeof value === 'object' && value !== null && '~orpc' in value
}
