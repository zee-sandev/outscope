import { oc } from '@orpc/contract'
import { implement } from '@orpc/server'
import { z } from 'zod'
import {
  createApp,
  defineAccess,
  defineHandle,
  defineHandlers,
  type BaseORPCContext,
} from '@outscope/nova-fn'

const pingOutput = z.object({
  pong: z.boolean(),
})

export const routes = {
  health: {
    ping: oc.route({ method: 'GET', path: '/health/ping' }).output(pingOutput),
  },
}

type AppContext = BaseORPCContext

const publicProducer = implement(routes).$context<AppContext>()

export const access = defineAccess({
  default: 'public',
  policies: {
    public: { kind: 'plain', producer: publicProducer },
  },
})

const handle = defineHandle(access)

export const healthHandlers = defineHandlers(routes.health, {
  ping: handle.public(() => ({ pong: true })),
})

const app = await createApp<AppContext>({
  routes,
  access,
  handlers: {
    health: healthHandlers,
  },
})

if (
  process.argv[1] &&
  import.meta.url === new URL(process.argv[1], 'file:').href
) {
  app.listen(3000, ({ port }) => {
    console.log(`Nova fn basic example listening on http://localhost:${port}`)
  })
}

export default app
