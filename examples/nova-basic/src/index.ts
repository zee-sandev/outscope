import 'reflect-metadata'
import { oc } from '@orpc/contract'
import { implement } from '@orpc/server'
import { z } from 'zod'
import {
  Controller,
  Handle,
  Public,
  createApp,
  defineAccess,
  type BaseORPCContext,
} from '@outscope/nova'

const helloInput = z.object({
  name: z.string().optional(),
})

const helloOutput = z.object({
  message: z.string(),
})

export const routes = {
  hello: oc
    .route({ method: 'GET', path: '/hello' })
    .input(helloInput)
    .output(helloOutput),
}

type AppContext = BaseORPCContext

const publicProducer = implement(routes).$context<AppContext>()

export const access = defineAccess({
  default: 'public',
  policies: {
    public: { producer: publicProducer },
  },
})

@Controller()
class HelloController {
  @Public()
  @Handle(routes.hello)
  hello(input: z.infer<typeof helloInput>) {
    return {
      message: `Hello ${input.name ?? 'Nova'}`,
    }
  }
}

const app = await createApp<AppContext>({
  routes,
  access,
  controllers: [HelloController],
})

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  app.listen(3000, ({ port }) => {
    console.log(`Nova basic example listening on http://localhost:${port}`)
  })
}

export default app
