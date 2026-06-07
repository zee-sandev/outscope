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

export const routes = {
  hello: oc
    .route({ method: 'GET', path: '/hello' })
    .input(helloInput)
    .output(z.object({ message: z.string() })),
}

type AppContext = BaseORPCContext

const publicProducer = implement(routes).$context<AppContext>()

const access = defineAccess({
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
    return { message: `Hello ${input.name ?? 'Nova'}` }
  }
}

const app = await createApp<AppContext>({
  routes,
  access,
  controllers: [HelloController],
})

app.listen(3000, ({ port }) => {
  console.log(`API listening on http://localhost:${port}`)
})
