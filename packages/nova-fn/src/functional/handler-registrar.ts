import type { AnyContractRouter } from '@orpc/contract'
import { implement } from '@orpc/server'
import type { HandlerDef, HandlerMap } from './define-handlers.js'
import type { RouteRegisterConfig, WithORPCMetadata } from '../domain/types.js'
import { MissingHandlerError } from '../domain/errors.js'
import { ContractResolver } from '../application/contract-resolver.js'
import { InputExtractor } from '../application/input-extractor.js'
import { normalizeError } from '../domain/errors.js'
import { createAccessMiddleware, resolveAccessPolicy } from '../domain/access.js'

export class HandlerRegistrar {
  private readonly config: RouteRegisterConfig
  private readonly contractResolver: ContractResolver
  private readonly inputExtractor: InputExtractor

  constructor(config: RouteRegisterConfig) {
    this.config = config
    this.contractResolver = new ContractResolver()
    this.inputExtractor = new InputExtractor()
  }

  register(handlers: HandlerMap): AnyContractRouter {
    const router: Record<string, unknown> = {}
    this.walkHandlers(handlers, [], this.config.routes as Record<string, unknown>, router)
    return router as AnyContractRouter
  }

  private walkHandlers(
    map: Record<string, HandlerDef | Record<string, HandlerDef>>,
    parentPath: string[],
    routeNode: Record<string, unknown>,
    router: Record<string, unknown>,
  ): void {
    for (const [key, value] of Object.entries(map)) {
      if (this.isHandlerDef(value)) {
        const route = routeNode?.[key]
        if (!route) {
          throw new MissingHandlerError(`Route path ${[...parentPath, key].join('.')} not found`)
        }
        this.registerHandler(route, value, router)
      } else {
        this.walkHandlers(
          value as Record<string, HandlerDef>,
          [...parentPath, key],
          (routeNode?.[key] ?? {}) as Record<string, unknown>,
          router,
        )
      }
    }
  }

  private registerHandler(route: unknown, handlerDef: HandlerDef, router: Record<string, unknown>): void {
    const { handler, middlewares, catchErrors, access } = handlerDef
    const routePath = this.config.routes
      ? this.contractResolver.findContractPath(this.config.routes, route)
      : []
    const accessPolicy = resolveAccessPolicy(access, this.config.access)

    let implementer: unknown = accessPolicy.producer || implement(route as AnyContractRouter)

    if (this.hasUseMethod(implementer)) {
      implementer = (implementer as { use: (m: unknown) => unknown }).use(createAccessMiddleware(accessPolicy.metadata))
    }

    for (const middleware of middlewares) {
      if (this.hasUseMethod(implementer)) {
        implementer = (implementer as { use: (m: unknown) => unknown }).use(middleware)
      }
    }

    let finalImplementer: unknown
    if (routePath.length > 0) {
      let current: any = implementer
      for (const pathKey of routePath) {
        if (current && typeof current === 'object' && pathKey in current) {
          current = current[pathKey]
        } else {
          throw new MissingHandlerError(`Route path ${routePath.join('.')} not found in access producer`)
        }
      }
      finalImplementer = current
    } else {
      const found = this.contractResolver.findProcedure(implementer, route)
      finalImplementer = found || implementer
    }

    if (!this.hasHandlerMethod(finalImplementer)) {
      throw new MissingHandlerError(`No handler method found for route at path: ${routePath.join('.')}`)
    }

    const wrappedHandler = catchErrors
      ? this.wrapWithErrorHandling(handler)
      : handler

    const procedure = (
      finalImplementer as { handler: (fn: Function) => WithORPCMetadata }
    ).handler(({ input, context }: { input: unknown; context: unknown }) => {
      const normalizedInput = this.inputExtractor.normalize(input)
      return wrappedHandler(normalizedInput, {
        ...(typeof context === 'object' && context !== null ? context : {}),
        access: accessPolicy.metadata,
      })
    })

    this.deepMerge(router, this.buildRouterStructure(routePath, procedure))
  }

  private wrapWithErrorHandling(
    handler: (input: any, context: any) => Promise<any>,
  ): (input: any, context: any) => Promise<any> {
    return async (input: any, context: any) => {
      try {
        return await handler(input, context)
      } catch (error) {
        throw normalizeError(error)
      }
    }
  }

  private buildRouterStructure(routePath: string[], procedure: WithORPCMetadata): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    let current = result

    for (let i = 0; i < routePath.length - 1; i++) {
      current[routePath[i]] = {}
      current = current[routePath[i]] as Record<string, unknown>
    }

    if (routePath.length > 0) {
      current[routePath[routePath.length - 1]] = procedure
    }

    return result
  }

  private deepMerge(target: Record<string, any>, source: Record<string, any>): void {
    for (const key in source) {
      if (typeof source[key] === 'object' && source[key] !== null && !('~orpc' in source[key])) {
        if (!target[key]) target[key] = {}
        this.deepMerge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }

  private hasHandlerMethod(
    implementer: unknown,
  ): implementer is { handler: (fn: Function) => WithORPCMetadata } {
    return (
      typeof implementer === 'object' &&
      implementer !== null &&
      'handler' in implementer &&
      typeof (implementer as { handler: unknown }).handler === 'function'
    )
  }

  private hasUseMethod(implementer: unknown): implementer is { use: (middleware: unknown) => unknown } {
    if (typeof implementer !== 'object' || implementer === null) return false
    try {
      return typeof (implementer as { use: unknown }).use === 'function'
    } catch {
      return false
    }
  }

  private isHandlerDef(value: unknown): value is HandlerDef {
    return (
      typeof value === 'object' &&
      value !== null &&
      'handler' in value &&
      'access' in value &&
      typeof (value as HandlerDef).handler === 'function'
    )
  }
}
