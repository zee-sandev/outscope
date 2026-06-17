import type { Context } from 'hono'
import type { AnyContractProcedure, AnyContractRouter } from '@orpc/contract'
import type { AccessConfig } from './access.js'

/**
 * Core domain types for oRPC-Hono integration
 */

/**
 * HTTP method types supported by the framework
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * Route configuration from route metadata
 */
export interface RouteMetadata {
  /** HTTP method for the route */
  method: HttpMethod
  /** URL path for the route */
  path: string
}

/**
 * Metadata structure attached to oRPC route procedures
 */
export interface ORPCMetadata<TInput = unknown, TOutput = unknown, TContext = unknown> {
  /** Route configuration if procedure is exposed as HTTP endpoint */
  route?: RouteMetadata
  /** Reference to the route procedure */
  contract?: AnyContractProcedure
  /** Handler function for the procedure */
  handler?: ProcedureHandler<TInput, TOutput, TContext>
  /** Additional metadata fields */
  [key: string]: unknown
}

/**
 * Object with oRPC metadata attached
 */
export interface WithORPCMetadata<TInput = unknown, TOutput = unknown, TContext = unknown> {
  /** oRPC metadata symbol */
  '~orpc': ORPCMetadata<TInput, TOutput, TContext>
  /** Additional fields */
  [key: string]: unknown
}

/**
 * Handler function signature for oRPC procedures
 */
export type ProcedureHandler<TInput = unknown, TOutput = unknown, TContext = unknown> = (params: {
  input: TInput
  context: TContext
}) => TOutput | Promise<TOutput>

/**
 * Metadata for a controller method implementation
 */
export interface ImplementationMetadata<TInput = unknown, TOutput = unknown, TContext = unknown> {
  /** The route procedure being handled */
  contract: AnyContractProcedure
  /** Name of the method in the controller class */
  methodName: string | symbol
  /** The method implementation */
  method: (...args: unknown[]) => unknown | Promise<unknown>
  /** Optional middleware to apply to this specific method */
  middleware?: unknown
}

/**
 * Configuration options for ORPCHono initialization
 */
export interface ORPCHonoOptions<TContract extends AnyContractRouter = AnyContractRouter> {
  /**
   * Hono middleware functions to apply globally
   * @default []
   */
  interceptors?: HonoMiddleware[]

  /**
   * Root route router for automatic path resolution
   */
  routes?: TContract

  /**
   * Global access policy registry.
   */
  access: AccessConfig
}

/**
 * Hono middleware function type
 */
export type HonoMiddleware = (c: Context, next: () => Promise<void>) => Promise<void>

/**
 * Options for controller registration
 */
export interface ApplyMiddlewareOptions {
  /**
   * Controller instances to register
   */
  controllers?: unknown[]
}

/**
 * Context passed to procedure handlers
 */
export interface ProcedureContext {
  /** Hono context for accessing request/response */
  honoContext: Context
  /** Additional context properties */
  [key: string]: unknown
}

/**
 * Input extraction result
 */
export interface ExtractedInput {
  /** Extracted input data */
  data: unknown
  /** Original request context */
  context: Context
}

/**
 * Route registration configuration
 */
export interface RouteRegistration {
  /** HTTP paths to register */
  paths: string[]
  /** HTTP method for the route */
  method: HttpMethod
  /** Handler function */
  handler: (c: Context) => Promise<Response>
}

/**
 * Route registration configuration
 */
export interface RouteRegisterConfig {
  routes?: AnyContractRouter
  access: AccessConfig
}

/**
 * Type guard to check if an object has oRPC metadata
 */
export function hasORPCMetadata(obj: unknown): obj is WithORPCMetadata {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '~orpc' in obj &&
    typeof (obj as Record<string, unknown>)['~orpc'] === 'object'
  )
}

// Re-export plugin types that are part of the public API
export type {
  AppConfig,
  OutscopeApp,
  Plugin,
  PluginContext,
  PluginFactory,
  ServerInfo,
  ErrorHandler,
} from '../plugins/types.js'
