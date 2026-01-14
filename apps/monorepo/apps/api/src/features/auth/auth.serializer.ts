import type { User, Session } from '@generated/prisma'
import type { RegisterResult, LoginResult, MeResult } from './auth.service'
import type { RegisterOutput, LoginOutput, MeOutput } from '@schemas/auth'

/**
 * Serialize user model to output
 */
const userToOutput = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  image: user.image || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

/**
 * Serialize session model to output
 */
const sessionToOutput = (session: Session, token?: string) => ({
  id: session.id,
  userId: session.userId,
  expiresAt: session.expiresAt,
  token: token || '', // Token is only included on register/login
  activeOrganizationId: session.activeOrganizationId || null,
})

/**
 * Serialize register result to output
 */
const registerResultToOutput = (result: RegisterResult, token: string): RegisterOutput => ({
  user: userToOutput(result.user),
  session: sessionToOutput(result.session, token),
  organization: result.organization,
})

/**
 * Serialize login result to output
 */
const loginResultToOutput = (result: LoginResult, token: string): LoginOutput => ({
  user: userToOutput(result.user),
  session: sessionToOutput(result.session, token),
})

/**
 * Serialize me result to output
 */
const meResultToOutput = (result: MeResult): MeOutput => ({
  user: userToOutput(result.user),
  session: {
    id: result.session.id,
    userId: result.session.userId,
    expiresAt: result.session.expiresAt,
    activeOrganizationId: result.session.activeOrganizationId || null,
  },
  organizations: result.organizations,
})

export const authSerializer = {
  userToOutput,
  sessionToOutput,
  registerResultToOutput,
  loginResultToOutput,
  meResultToOutput,
} as const
