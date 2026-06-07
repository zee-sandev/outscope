import 'reflect-metadata'
import { implement } from '@orpc/server'
import {
  Controller,
  Handle,
  Permission,
  createApp,
  defineAccess,
  type BaseORPCContext,
} from '@outscope/nova'
import { routes } from '@workspace/routes'
import type { CreateProjectInput } from '@workspace/schemas'

interface AppContext extends BaseORPCContext {
  user?: { id: string; permissions: string[] }
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

const access = defineAccess({
  default: 'public',
  policies: {
    public: { producer: publicProducer },
    auth: { producer: authProducer },
    permission: { producer: permissionProducer },
  },
})

@Controller()
class ProjectController {
  @Permission('project:create')
  @Handle(routes.projects.create)
  create(input: CreateProjectInput) {
    return {
      id: 'project_001',
      name: input.name,
    }
  }
}

const app = await createApp<AppContext>({
  routes,
  access,
  controllers: [ProjectController],
})

app.listen(3000, ({ port }) => {
  console.log(`API listening on http://localhost:${port}`)
})
