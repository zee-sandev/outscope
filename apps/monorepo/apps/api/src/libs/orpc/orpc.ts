import { implement } from '@orpc/server'
import { ORPCError } from '@orpc/server'
import { contract } from '@workspace/contracts'
import type { ORPCContext } from './context'
import { createLogger } from '@outscope/nova'
import { auth } from '@libs/auth'

export const pub = implement(contract).$context<ORPCContext>()

const logger = createLogger({ level: 'debug', pretty: true })

/**
 * Authentication middleware — uses Better Auth's official getSession API
 */
export const authMiddleware = pub.middleware(async ({ next, context }) => {
  const headers = context.headers ?? context.honoContext?.req?.raw?.headers
  const session = headers ? await auth.api.getSession({ headers }) : null

  if (!session?.user || !session?.session) {
    logger.debug('No valid session found')
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Authentication required. Please login to continue.',
    })
  }

  logger.debug(
    {
      userId: session.user.id,
      email: session.user.email,
      activeOrganizationId: session.session.activeOrganizationId,
    },
    'Session verified successfully'
  )

  return next({
    context: {
      ...context,
      auth: {
        userId: session.user.id,
        email: session.user.email,
        tenantId: session.session.activeOrganizationId ?? '',
      },
    },
  })
})
