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

const helloInput = z.object({
  name: z.string().optional(),
})

export const routes = {
  hello: {
    greet: oc
      .route({ method: 'GET', path: '/hello' })
      .input(helloInput)
      .output(z.object({ message: z.string() })),
  },
}

type AppContext = BaseORPCContext

const publicProducer = implement(routes).$context<AppContext>()

const access = defineAccess({
  default: 'public',
  policies: {
    public: { kind: 'plain', producer: publicProducer },
  },
})

const handle = defineHandle(access)

const helloHandlers = defineHandlers(routes.hello, {
  greet: handle.public((input) => ({
    message: `Hello ${input.name ?? 'Nova'}`,
  })),
})

const app = await createApp<AppContext>({
  routes,
  access,
  handlers: {
    hello: helloHandlers,
  },
})

app.listen(3000, ({ port }) => {
  console.log(`API listening on http://localhost:${port}`)
})
