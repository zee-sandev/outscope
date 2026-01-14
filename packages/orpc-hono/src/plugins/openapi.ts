import type { Plugin, PluginFactory } from './types'
import type { BaseORPCContext } from '../domain/context'

/**
 * OpenAPI plugin options
 */
export interface OpenAPIPluginOptions {
  /**
   * API title for OpenAPI spec
   */
  title: string

  /**
   * API version
   */
  version: string

  /**
   * API description
   */
  description?: string

  /**
   * Path for Swagger UI
   * @default '/'
   */
  swaggerPath?: string

  /**
   * Path for OpenAPI JSON spec
   * @default '/openapi.json'
   */
  specPath?: string

  /**
   * Server URLs for the API
   */
  servers?: Array<{
    url: string
    description?: string
  }>

  /**
   * Contact information
   */
  contact?: {
    name?: string
    url?: string
    email?: string
  }

  /**
   * License information
   */
  license?: {
    name: string
    url?: string
  }

  /**
   * External documentation
   */
  externalDocs?: {
    description?: string
    url: string
  }
}

/**
 * Create an OpenAPI documentation plugin.
 *
 * This plugin:
 * - Generates OpenAPI 3.0 specification from your contracts
 * - Serves Swagger UI at the configured path
 * - Serves the OpenAPI JSON spec at the configured path
 *
 * @param options - OpenAPI configuration options
 * @returns A plugin that adds OpenAPI documentation
 *
 * @example
 * ```typescript
 * const app = await createApp({
 *   contract,
 *   controllers: [...],
 *   plugins: [
 *     openapiPlugin({
 *       title: 'My API',
 *       version: '1.0.0',
 *       description: 'API for my application',
 *     }),
 *   ],
 * })
 * ```
 */
export const openapiPlugin: PluginFactory<OpenAPIPluginOptions, BaseORPCContext> = (options) => {
  const {
    title,
    version,
    description,
    swaggerPath = '/',
    specPath = '/openapi.json',
    servers,
    contact,
    license,
    externalDocs,
  } = options

  return {
    name: 'openapi',

    async onReady({ app, contract, config }) {
      let openApiSpec: object | null = null

      // Generate OpenAPI spec
      try {
        const { OpenAPIGenerator } = await import('@orpc/openapi')
        const { ZodToJsonSchemaConverter } = await import('@orpc/zod')

        const generator = new OpenAPIGenerator({
          schemaConverters: [new ZodToJsonSchemaConverter()],
        })

        openApiSpec = await generator.generate(contract, {
          info: {
            title,
            version,
            description,
            contact,
            license,
          },
          servers: servers ?? [
            {
              url: config.apiPrefix ?? '/api',
              description: 'API Server',
            },
          ],
          externalDocs,
        })
      } catch (error) {
        console.warn('Failed to generate OpenAPI spec:', error)
        openApiSpec = {
          openapi: '3.0.0',
          info: { title, version, description },
          paths: {},
        }
      }

      // Serve OpenAPI spec
      app.get(specPath, (c) => c.json(openApiSpec))

      // Serve Swagger UI
      try {
        const { swaggerUI } = await import('@hono/swagger-ui')

        app.get(
          swaggerPath,
          swaggerUI({
            url: specPath,
            spec: openApiSpec as any,
          })
        )
      } catch {
        // Swagger UI not available, serve basic HTML fallback
        app.get(swaggerPath, (c) => {
          const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${title} - API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '${specPath}',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout'
    });
  </script>
</body>
</html>`
          return c.html(html)
        })
      }
    },
  }
}
