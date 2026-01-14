import { auth } from '@libs/auth'
import { createLogger } from '@outscope/orpc-hono'

const logger = createLogger({ level: 'debug', pretty: true })
import { authRepository } from './auth.repository'
import type { RegisterInput, LoginInput } from '@schemas/auth'
import type { User, Session } from '@generated/prisma'

export type RegisterResult = {
  user: User
  session: Session
  organization: {
    id: string
    name: string
    slug: string
  } | null
}

export type LoginResult = {
  user: User
  session: Session
}

export type MeResult = {
  user: User
  session: Session
  organizations: {
    id: string
    name: string
    slug: string
    role: string
  }[]
}

export const authService = {
  /**
   * Register a new user with optional organization
   */
  register: async (input: RegisterInput): Promise<RegisterResult> => {
    logger.info({ email: input.email, name: input.name }, 'Auth service: register')

    // Use Better Auth signUp API
    const result = await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: input.password,
        name: input.name,
      },
    })

    if (!result || !result.user || !result.token) {
      throw new Error('Failed to create user - no result returned from Better Auth')
    }

    // Get session info from database using token
    const sessionData = await authRepository.findSessionByToken(result.token)

    if (!sessionData) {
      throw new Error('Session not created')
    }

    // Create organization if organizationName is provided
    let organization = null
    if (input.organizationName) {
      const slug = input.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const orgId = crypto.randomUUID()

      // Create organization
      const org = await authRepository.createOrganization(
        orgId,
        input.organizationName,
        slug,
        result.user.id
      )

      // Add user as owner
      await authRepository.addUserToOrganization(result.user.id, org.id, 'owner')

      organization = {
        id: org.id,
        name: org.name,
        slug: org.slug,
      }

      // Update session with active organization
      await authRepository.updateSessionOrganization(sessionData.id, org.id)
      sessionData.activeOrganizationId = org.id

      logger.info(
        { userId: result.user.id, organizationId: org.id, organizationName: org.name },
        'Organization created and user added as owner'
      )
    }

    logger.info({ userId: result.user.id, email: result.user.email }, 'User registered successfully')

    return {
      user: result.user as User,
      session: sessionData,
      organization,
    }
  },

  /**
   * Login user
   */
  login: async (input: LoginInput): Promise<LoginResult> => {
    logger.info({ email: input.email }, 'Auth service: login')

    // Use Better Auth signIn API
    const result = await auth.api.signInEmail({
      body: {
        email: input.email,
        password: input.password,
      },
    })

    if (!result || !result.user || !result.token) {
      throw new Error('Invalid credentials')
    }

    // Get session info from database using token
    const sessionData = await authRepository.findSessionByToken(result.token)

    if (!sessionData) {
      throw new Error('Session not found')
    }

    logger.info({ userId: result.user.id, email: result.user.email }, 'User logged in successfully')

    return {
      user: result.user as User,
      session: sessionData,
    }
  },

  /**
   * Get current user info
   */
  me: async (userId: string, sessionToken: string): Promise<MeResult> => {
    logger.debug({ userId }, 'Auth service: me')

    // Get user from database
    const user = await authRepository.findUserById(userId)

    if (!user) {
      throw new Error('User not found')
    }

    // Get active session
    const session = await authRepository.findSessionByToken(sessionToken)

    if (!session) {
      throw new Error('Session not found')
    }

    // Get user's organizations
    const organizationsWithRoles = await authRepository.getUserOrganizations(user.id)

    const organizations = organizationsWithRoles.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      role: org.role,
    }))

    return {
      user,
      session,
      organizations,
    }
  },

  /**
   * Logout user
   */
  logout: async (sessionToken: string): Promise<void> => {
    logger.info('Auth service: logout')

    await authRepository.deleteSession(sessionToken)

    logger.info('User logged out successfully')
  },
} as const
