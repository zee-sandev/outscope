import { implement } from '@orpc/server'
import { ORPCError } from '@orpc/server'
import { contract } from '../../contracts'
import type { ORPCContext } from './context'
import { createLogger } from '@outscope/orpc-hono'
import { auth } from '@libs/auth'

export const pub = implement(contract).$context<ORPCContext>()

const logger = createLogger({ level: 'debug', pretty: true })

/**
 * Authentication middleware
 * Validates session token and adds auth info to context
 */
export const authMiddleware = async ({ next, context }: { next: any; context: ORPCContext }) => {
  try {
    // Get Authorization or Cookie header
    const authHeader = context.honoContext?.req?.header('authorization')
    const cookieHeader = context.honoContext?.req?.header('cookie')

    // Extract session token from Bearer token or cookie
    let sessionToken: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7)
    } else if (cookieHeader) {
      const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/)
      if (match && match[1]) {
        sessionToken = match[1]
      }
    }

    if (!sessionToken) {
      logger.debug('No session token found in Authorization header or cookie')
      throw new ORPCError('UNAUTHORIZED', {
        message: 'Not authenticated. Please login to continue.',
      })
    }

    // Get session from database using token
    const { prisma } = await import('@libs/prisma')

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    })

    if (!session || !session.user) {
      logger.debug('Invalid or expired session token')
      throw new ORPCError('UNAUTHORIZED', {
        message: 'Invalid or expired session. Please login again.',
      })
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
      logger.debug('Session expired')
      throw new ORPCError('UNAUTHORIZED', {
        message: 'Session expired. Please login again.',
      })
    }

    logger.debug(
      {
        userId: session.user.id,
        email: session.user.email,
        activeOrganizationId: session.activeOrganizationId,
      },
      'Session verified successfully'
    )

    // Add auth info to context
    return next({
      context: {
        ...context,
        auth: {
          userId: session.user.id,
          tenantId: session.activeOrganizationId || '',
          email: session.user.email,
        },
      },
    })
  } catch (error) {
    // If it's already an ORPCError, re-throw it
    if (error instanceof ORPCError) {
      throw error
    }

    // Otherwise, wrap in generic UNAUTHORIZED error
    logger.error({ error }, 'Failed to verify session')
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Invalid or expired session. Please login again.',
    })
  }
}
