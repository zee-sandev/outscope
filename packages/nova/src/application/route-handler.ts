import type { Context } from 'hono'
import type { WithORPCMetadata, ProcedureContext, HttpMethod } from '../domain/types'
import { hasORPCMetadata } from '../domain/types'
import { toORPCHonoError, InvalidProcedureError } from '../domain/errors'
import { InputExtractor } from './input-extractor'

/**
 * Factory for creating route handlers that execute oRPC procedures
 *
 * Handles the complete request/response cycle:
 * 1. Extract input from HTTP request
 * 2. Build procedure context
 * 3. Execute oRPC procedure
 * 4. Return JSON response or error
 */
export class RouteHandlerFactory {
  private readonly inputExtractor: InputExtractor

  constructor(inputExtractor?: InputExtractor) {
    this.inputExtractor = inputExtractor ?? new InputExtractor()
  }

  /**
   * Create a Hono route handler for an oRPC procedure
   *
   * @param procedure - oRPC procedure with metadata
   * @param method - HTTP method for the route
   * @returns Hono handler function
   */
  createHandler(procedure: WithORPCMetadata, method: HttpMethod): (c: Context) => Promise<Response> {
    return async (context: Context): Promise<Response> => {
      try {
        // Extract input from request
        const rawInput = await this.inputExtractor.extract(context, method)

        // Build procedure context
        const procedureContext = this.buildContext(context)

        // Execute procedure
        const result = await this.executeProcedure(procedure, rawInput, procedureContext)

        // Return success response
        return context.json(result)
      } catch (error) {
        // Handle and format error response
        return this.handleError(context, error)
      }
    }
  }

  /**
   * Build the context object passed to procedures
   *
   * @param context - Hono context
   * @returns Procedure context
   */
  private buildContext(context: Context): ProcedureContext {
    return {
      honoContext: context,
    }
  }

  /**
   * Execute an oRPC procedure with input and context
   *
   * @param procedure - Procedure to execute
   * @param rawInput - Raw input from request
   * @param context - Procedure context
   * @returns Procedure result
   * @throws {InvalidProcedureError} If procedure structure is invalid
   */
  private async executeProcedure(
    procedure: WithORPCMetadata,
    rawInput: unknown,
    context: ProcedureContext
  ): Promise<unknown> {
    // Validate procedure structure
    if (!hasORPCMetadata(procedure)) {
      throw new InvalidProcedureError(
        `Procedure missing ~orpc metadata. Type: ${typeof procedure}`
      )
    }

    const handler = procedure['~orpc'].handler

    if (typeof handler !== 'function') {
      throw new InvalidProcedureError(
        `Procedure handler is not a function. Type: ${typeof handler}`
      )
    }

    // Execute handler with normalized input
    const input = this.inputExtractor.normalize(rawInput)
    return await handler({ input, context })
  }

  /**
   * Handle errors and format error responses
   *
   * @param context - Hono context
   * @param error - Error that occurred
   * @returns Error response
   */
  private handleError(context: Context, error: unknown): Response {
    const orpcError = toORPCHonoError(error)

    return context.json(orpcError.toJSON(), orpcError.status as never)
  }
}
