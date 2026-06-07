import { implement } from '@orpc/server'
import {
  createApp,
  defineAccess,
  defineHandlers,
  handle,
  type BaseORPCContext,
} from '@outscope/nova-fn'
import { routes } from '@workspace/routes'

interface AppContext extends BaseORPCContext {
  user?: { id: string; permissions: string[] }
}

const publicProducer = implement(routes).$context<AppContext>()

const authProducer = publicProducer.use(async ({ context, next }) => {
  context.user = { id: 'user_123', permissions: ['task:create'] }
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

const taskHandlers = defineHandlers(routes.tasks, {
  mine: handle.auth((_input, ctx) => [
    { id: 'task_001', title: 'First task', createdBy: ctx.user?.id ?? 'unknown' },
  ]),
  create: handle.permission('task:create', (input, ctx) => ({
    id: 'task_002',
    title: input.title,
    createdBy: ctx.user?.id ?? 'unknown',
  })),
})

const app = await createApp<AppContext>({
  routes,
  access,
  handlers: {
    tasks: taskHandlers,
  },
})

app.listen(3000, ({ port }) => {
  console.log(`API listening on http://localhost:${port}`)
})
