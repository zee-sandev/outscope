import type { AnyContractProcedure } from '@orpc/contract'

/**
 * Definition of a single API operation
 */
export interface OperationDef<TInput = any, TOutput = any, TContext = any> {
  /** The contract procedure this operation implements */
  readonly contract: AnyContractProcedure
  /** The handler function */
  readonly handler: (input: TInput, context: TContext) => Promise<TOutput>
  /** Middleware stack to apply */
  readonly middlewares: readonly unknown[]
  /** Whether to wrap with error handling */
  readonly catchErrors: boolean
}

/**
 * Configuration for an operation preset
 */
export interface PresetConfig {
  readonly middlewares: readonly unknown[]
  readonly catchErrors: boolean
}

/**
 * A map of operations, optionally nested by module name
 */
export type OperationMap = Record<string, OperationDef | Record<string, OperationDef>>

/**
 * Immutable builder for creating operation definitions.
 * Each method returns a new builder instance — no mutation.
 *
 * @example
 * ```typescript
 * const myOp = operation(contract, handler)
 *   .use(authMiddleware)
 *   .catch()
 *   .build()
 * ```
 */
class OperationBuilder<TInput, TOutput, TContext> {
  private readonly _contract: AnyContractProcedure
  private readonly _handler: (input: TInput, context: TContext) => Promise<TOutput>
  private readonly _middlewares: readonly unknown[]
  private readonly _catchErrors: boolean

  constructor(
    contract: AnyContractProcedure,
    handler: (input: TInput, context: TContext) => Promise<TOutput>,
    middlewares: readonly unknown[] = [],
    catchErrors = false,
  ) {
    this._contract = contract
    this._handler = handler
    this._middlewares = middlewares
    this._catchErrors = catchErrors
  }

  /**
   * Add middleware to this operation.
   * Returns a new builder — does not mutate the current one.
   */
  use(middleware: unknown): OperationBuilder<TInput, TOutput, TContext> {
    return new OperationBuilder(
      this._contract,
      this._handler,
      [...this._middlewares, middleware],
      this._catchErrors,
    )
  }

  /**
   * Enable error handling for this operation.
   * Returns a new builder — does not mutate the current one.
   */
  catch(): OperationBuilder<TInput, TOutput, TContext> {
    return new OperationBuilder(
      this._contract,
      this._handler,
      this._middlewares,
      true,
    )
  }

  /**
   * Build the final operation definition.
   */
  build(): OperationDef<TInput, TOutput, TContext> {
    return {
      contract: this._contract,
      handler: this._handler,
      middlewares: this._middlewares,
      catchErrors: this._catchErrors,
    }
  }
}

/**
 * Create an operation definition with a chainable builder.
 *
 * @param contract - The contract procedure to implement
 * @param handler - The handler function
 * @returns An immutable builder for configuring the operation
 *
 * @example
 * ```typescript
 * const myOp = operation(myContract.getUser, async (input, ctx) => {
 *   return userService.getById(input.id)
 * }).use(authMiddleware).catch().build()
 * ```
 */
export function operation<TInput, TOutput, TContext>(
  contract: AnyContractProcedure,
  handler: (input: TInput, context: TContext) => Promise<TOutput>,
): OperationBuilder<TInput, TOutput, TContext> {
  return new OperationBuilder(contract, handler)
}

/**
 * Create a factory with typed presets for app-wide operation creation.
 *
 * Presets let you define middleware stacks and error handling once at the app level,
 * then use them across all modules without importing middleware directly.
 *
 * @param config - Factory configuration with named presets
 * @returns An object with `op` containing preset functions
 *
 * @example
 * ```typescript
 * const { op } = createOperationFactory({
 *   presets: {
 *     public: { middlewares: [], catchErrors: true },
 *     protected: { middlewares: [authMiddleware], catchErrors: true },
 *     admin: { middlewares: [authMiddleware, adminMiddleware], catchErrors: true },
 *   },
 * })
 *
 * // In modules:
 * const userOps = {
 *   getProfile: op.protected(userContract.getProfile, async (input, ctx) => { ... }),
 *   listUsers: op.admin(userContract.listUsers, async (input, ctx) => { ... }),
 * }
 * ```
 */
export function createOperationFactory<
  TPresets extends Record<string, PresetConfig>,
>(config: {
  presets: TPresets
}): {
  op: {
    [K in keyof TPresets]: <TInput, TOutput>(
      contract: AnyContractProcedure,
      handler: (input: TInput, context: any) => Promise<TOutput>,
    ) => OperationDef<TInput, TOutput>
  }
} {
  const op = {} as Record<string, any>

  for (const [name, preset] of Object.entries(config.presets)) {
    op[name] = <TInput, TOutput>(
      contract: AnyContractProcedure,
      handler: (input: TInput, context: any) => Promise<TOutput>,
    ): OperationDef<TInput, TOutput> => ({
      contract,
      handler,
      middlewares: [...preset.middlewares],
      catchErrors: preset.catchErrors,
    })
  }

  return { op } as any
}
