import type { Hono } from 'hono'
import type { AnyContractRouter } from '@orpc/contract'
import type { WithORPCMetadata, HttpMethod } from '../domain/types'
import { hasORPCMetadata } from '../domain/types'
import { MissingRouteMetadataError, UnsupportedHttpMethodError } from '../domain/errors'
import { RouteHandlerFactory } from './route-handler'
import { ContractResolver } from './contract-resolver'

/**
 * Configuration for route registration
 */
export interface RouteRegistrarConfig {
  /** URL prefix for all routes */
  prefix: string
  /** Root contract router for path resolution */
  contractRouter?: AnyContractRouter
}

/**
 * Service for registering oRPC procedures as Hono routes
 *
 * Handles the mapping of oRPC contracts to HTTP endpoints, supporting:
 * - REST-style routes (GET /api/users/:id)
 * - oRPC-style routes (POST /api/users/get)
 * - Automatic path resolution from contract router structure
 */
export class RouteRegistrar {
  private readonly config: RouteRegistrarConfig
  private readonly handlerFactory: RouteHandlerFactory
  private readonly contractResolver: ContractResolver

  constructor(
    config: RouteRegistrarConfig,
    handlerFactory?: RouteHandlerFactory,
    contractResolver?: ContractResolver
  ) {
    this.config = config
    this.handlerFactory = handlerFactory ?? new RouteHandlerFactory()
    this.contractResolver = contractResolver ?? new ContractResolver()
  }

  /**
   * Register an oRPC procedure as Hono routes
   *
   * Creates multiple route registrations:
   * 1. REST route with contract's HTTP method and path
   * 2. oRPC-style route with POST method (for oRPC client compatibility)
   *
   * @param app - Hono application
   * @param contract - Contract procedure
   * @param procedure - Implemented procedure with handler
   * @param contractPath - Optional path segments for oRPC-style routing
   */
  register(
    app: Hono,
    contract: unknown,
    procedure: WithORPCMetadata,
    contractPath?: string[]
  ): void {
    // Extract route metadata
    const { method, paths } = this.extractRouteInfo(contract, contractPath)

    // Create handler
    const handler = this.handlerFactory.createHandler(procedure, method)

    // Register all paths with appropriate methods
    this.registerPaths(app, paths, method, handler)
  }

  /**
   * Extract route information from contract
   *
   * @param contract - Contract procedure
   * @param contractPath - Optional contract path
   * @returns Route method and paths to register
   */
  private extractRouteInfo(
    contract: unknown,
    contractPath?: string[]
  ): { method: HttpMethod; paths: string[] } {
    // Validate contract has oRPC metadata
    if (!hasORPCMetadata(contract)) {
      throw new MissingRouteMetadataError()
    }

    const metadata = contract['~orpc']
    const route = metadata.route

    if (!route) {
      throw new MissingRouteMetadataError()
    }

    // Build list of paths to register
    const paths = this.buildPaths(route.path, contractPath)

    return {
      method: route.method,
      paths,
    }
  }

  /**
   * Build list of paths to register
   *
   * @param restPath - REST-style path from contract
   * @param contractPath - oRPC-style path segments
   * @returns Array of paths to register
   */
  private buildPaths(restPath: string, contractPath?: string[]): string[] {
    const paths: string[] = []

    // Add oRPC-style path if available
    if (contractPath && contractPath.length > 0) {
      const orpcPath = this.config.prefix + '/' + contractPath.join('/')
      paths.push(orpcPath)
    }

    // Add REST-style path if different
    if (restPath) {
      const fullRestPath = this.config.prefix + restPath
      if (!paths.includes(fullRestPath)) {
        paths.push(fullRestPath)
      }
    }

    return paths
  }

  /**
   * Register handler with Hono for all paths and methods
   *
   * Registers each path with:
   * 1. The contract's specified HTTP method
   * 2. POST method (for oRPC client compatibility, if not already POST)
   *
   * @param app - Hono application
   * @param paths - Paths to register
   * @param method - Primary HTTP method
   * @param handler - Route handler
   */
  private registerPaths(
    app: Hono,
    paths: string[],
    method: HttpMethod,
    handler: (c: import('hono').Context) => Promise<Response>
  ): void {
    for (const path of paths) {
      // Register with contract's method
      this.registerWithMethod(app, path, method, handler)

      // Also register POST for oRPC client (if not already POST)
      if (method !== 'POST') {
        this.registerWithMethod(app, path, 'POST', handler)
      }
    }
  }

  /**
   * Register a single path with a specific HTTP method
   *
   * @param app - Hono application
   * @param path - URL path
   * @param method - HTTP method
   * @param handler - Route handler
   */
  private registerWithMethod(
    app: Hono,
    path: string,
    method: HttpMethod,
    handler: (c: import('hono').Context) => Promise<Response>
  ): void {
    const httpMethod = method.toLowerCase() as Lowercase<HttpMethod>

    switch (httpMethod) {
      case 'get':
        app.get(path, handler)
        break
      case 'post':
        app.post(path, handler)
        break
      case 'put':
        app.put(path, handler)
        break
      case 'delete':
        app.delete(path, handler)
        break
      case 'patch':
        app.patch(path, handler)
        break
      default:
        throw new UnsupportedHttpMethodError(method)
    }
  }

  /**
   * Resolve contract path from root router
   *
   * @param contract - Contract to find
   * @returns Path segments or empty array
   */
  resolveContractPath(contract: unknown): string[] {
    if (!this.config.contractRouter) {
      return []
    }

    return this.contractResolver.findContractPath(this.config.contractRouter, contract)
  }
}
