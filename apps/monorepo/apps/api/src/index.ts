import 'reflect-metadata'
import {
  createApp,
  corsPlugin,
  loggerPlugin,
  openapiPlugin,
} from '@outscope/nova'
import { contract } from '@workspace/contracts'
import { createContext, type ORPCContext } from 'libs/orpc/context'
import { pub } from 'libs/orpc/orpc'
import { auth } from '@libs/auth'

const PORT = Number(process.env.PORT) || 3000
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:3000').split(',')

async function bootstrap() {
  const app = await createApp<ORPCContext>({
    contract,
    producer: pub,
    controllers: 'src/modules/**/*.controller.ts',
    createContext,
    apiPrefix: '/api',
    rpcPrefix: '/rpc',
    plugins: [
      corsPlugin({
        origins: CORS_ORIGINS,
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
      }),
      loggerPlugin({
        level: 'debug',
        pretty: true,
      }),
      openapiPlugin({
        title: 'Starter Template API',
        version: '1.0.0',
        description: 'Full-stack monorepo starter template with Next.js, Hono, oRPC, and Prisma',
      }),
    ],
  })

  // Mount Better Auth native handler for session management endpoints
  // e.g. GET /api/auth/session, POST /api/auth/sign-out, GET /api/auth/organization/list
  app.hono.on(['POST', 'GET'], '/api/auth/**', (c) => {
    return auth.handler(c.req.raw)
  })

  app.listen(PORT, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  })
}

bootstrap()
