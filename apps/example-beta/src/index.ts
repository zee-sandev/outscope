import 'reflect-metadata'
import {
  createApp,
  corsPlugin,
  loggerPlugin,
  openapiPlugin,
} from '@outscope/nova'
import { contract } from './contracts'
import { createContext, type ORPCContext } from 'libs/orpc/context'
import { pub } from 'libs/orpc/orpc'

const PORT = 3005

async function bootstrap() {
  const app = await createApp<ORPCContext>({
    contract,
    producer: pub,
    controllers: 'src/features/**/*.controller.ts',
    createContext,
    apiPrefix: '/api',
    rpcPrefix: '/rpc',
    plugins: [
      corsPlugin({
        origins: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
      }),
      loggerPlugin({
        level: 'debug',
        pretty: true,
      }),
      openapiPlugin({
        title: '@outscope/nova Example API',
        version: '1.0.0',
        description: 'Example API demonstrating @outscope/nova with OOP decorators',
      }),
    ],
  })

  app.listen(PORT, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  })
}

bootstrap()
