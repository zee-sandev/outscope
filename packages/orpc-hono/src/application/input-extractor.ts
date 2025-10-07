import type { Context } from 'hono'
import type { HttpMethod } from '../domain/types'

/**
 * Service for extracting and normalizing input from HTTP requests
 *
 * Handles different input sources based on HTTP method:
 * - GET/DELETE: Path params + Query params
 * - POST/PUT/PATCH: Path params + Query params + Body
 */
export class InputExtractor {
  /**
   * Extract input from Hono context based on HTTP method
   *
   * @param context - Hono context
   * @param method - HTTP method
   * @returns Extracted and merged input data
   */
  async extract(context: Context, method: HttpMethod): Promise<unknown> {
    const isReadMethod = method === 'GET' || method === 'DELETE'

    if (isReadMethod) {
      return this.extractFromParams(context)
    }

    return this.extractWithBody(context)
  }

  /**
   * Extract input from path and query parameters only
   *
   * @param context - Hono context
   * @returns Merged path and query parameters
   */
  private extractFromParams(context: Context): Record<string, unknown> {
    return {
      ...context.req.param(),
      ...context.req.query(),
    }
  }

  /**
   * Extract input from path params, query params, and request body
   *
   * @param context - Hono context
   * @returns Merged path params, query params, and body
   */
  private async extractWithBody(context: Context): Promise<Record<string, unknown>> {
    const body = await this.extractBody(context)

    return {
      ...context.req.param(),
      ...context.req.query(),
      ...body,
    }
  }

  /**
   * Extract and parse request body
   *
   * @param context - Hono context
   * @returns Parsed body or empty object if parsing fails
   */
  private async extractBody(context: Context): Promise<Record<string, unknown>> {
    try {
      return await context.req.json()
    } catch {
      return {}
    }
  }

  /**
   * Normalize input to handle oRPC client format
   *
   * oRPC client may send input wrapped in { json: {...} }
   * This method unwraps it to get the actual data.
   *
   * @param input - Raw input from request
   * @returns Normalized input
   */
  normalize(input: unknown): unknown {
    if (this.isWrappedInput(input)) {
      return input.json
    }
    return input
  }

  /**
   * Check if input is wrapped in oRPC client format
   *
   * @param input - Input to check
   * @returns true if input is wrapped
   */
  private isWrappedInput(input: unknown): input is { json: unknown } {
    return (
      typeof input === 'object' &&
      input !== null &&
      'json' in input &&
      Object.keys(input).length === 1
    )
  }
}
