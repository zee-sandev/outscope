import 'reflect-metadata'
import { oc } from '@orpc/contract'
import { implement } from '@orpc/server'
import { z } from 'zod'
import {
  Auth,
  Controller,
  Handle,
  Permission,
  Public,
  createApp,
  defineAccess,
  type BaseORPCContext,
} from '@outscope/nova'

interface AppContext extends BaseORPCContext {
  user?: { id: string; permissions: string[] }
}

const projectInput = z.object({
  name: z.string().min(1),
})

const projectOutput = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
})

export const routes = {
  status: oc.route({ method: 'GET', path: '/status' }).output(z.object({ ok: z.boolean() })),
  me: oc.route({ method: 'GET', path: '/me' }).output(z.object({ id: z.string() })),
  createProject: oc
    .route({ method: 'POST', path: '/projects' })
    .input(projectInput)
    .output(projectOutput),
}

const publicProducer = implement(routes).$context<AppContext>()

const authProducer = publicProducer.use(async ({ context, next }) => {
  context.user = { id: 'user_123', permissions: ['project:create'] }
  return next({ context })
})

const permissionProducer = authProducer.use(async ({ context, next }) => {
  const required = context.access?.permissions ?? []
  const allowed = required.every((permission) => context.user?.permissions.includes(permission))
  if (!allowed) {
    throw new Error(`Missing permission: ${required.join(', ')}`)
  }

  return next({ context })
})

export const access = defineAccess({
  default: 'public',
  policies: {
    public: { producer: publicProducer },
    auth: { producer: authProducer },
    permission: { producer: permissionProducer },
  },
})

@Controller()
class ProjectController {
  @Public()
  @Handle(routes.status)
  status() {
    return { ok: true }
  }

  @Auth()
  @Handle(routes.me)
  me(_: unknown, ctx: AppContext) {
    return { id: ctx.user?.id ?? 'anonymous' }
  }

  @Permission('project:create')
  @Handle(routes.createProject)
  create(input: z.infer<typeof projectInput>, ctx: AppContext) {
    return {
      id: 'project_001',
      name: input.name,
      ownerId: ctx.user?.id ?? 'unknown',
    }
  }
}

const app = await createApp<AppContext>({
  routes,
  access,
  controllers: [ProjectController],
})

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  app.listen(3000, ({ port }) => {
    console.log(`Nova access example listening on http://localhost:${port}`)
  })
}

export default app
