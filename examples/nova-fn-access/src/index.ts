import { oc } from '@orpc/contract'
import { implement } from '@orpc/server'
import { z } from 'zod'
import {
  createApp,
  defineAccess,
  defineHandlers,
  handle,
  type BaseORPCContext,
} from '@outscope/nova-fn'

interface AppContext extends BaseORPCContext {
  user?: { id: string; permissions: string[] }
}

const taskInput = z.object({
  title: z.string().min(1),
})

const taskOutput = z.object({
  id: z.string(),
  title: z.string(),
  createdBy: z.string(),
})

export const routes = {
  tasks: {
    mine: oc
      .route({ method: 'GET', path: '/tasks/mine' })
      .output(z.object({ userId: z.string() })),
    create: oc
      .route({ method: 'POST', path: '/tasks' })
      .input(taskInput)
      .output(taskOutput),
  },
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

export const access = defineAccess({
  default: 'public',
  policies: {
    public: { producer: publicProducer },
    auth: { producer: authProducer },
    permission: { producer: permissionProducer },
  },
})

export const taskHandlers = defineHandlers(routes.tasks, {
  mine: handle.auth((_input, ctx) => ({
    userId: ctx.user?.id ?? 'anonymous',
  })),
  create: handle.permission('task:create', (input, ctx) => ({
    id: 'task_001',
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

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  app.listen(3000, ({ port }) => {
    console.log(`Nova fn access example listening on http://localhost:${port}`)
  })
}

export default app
