import { operation, extractBearerToken } from '@outscope/nova-fn'
import { auth as authContract } from '@contracts/auth'
import type { ORPCContext, AuthedORPCContext } from '@libs/orpc/context'
import { authMiddleware } from '@libs/orpc/orpc'
import { authService } from './auth.service'
import { authSerializer } from './auth.serializer'

const register = operation(authContract.register, async (input, _context: ORPCContext) => {
  const result = await authService.register(input)
  const token = result.session.token
  return authSerializer.registerResultToOutput(result, token)
})
  .catch()
  .build()

const login = operation(authContract.login, async (input, _context: ORPCContext) => {
  const result = await authService.login(input)
  const token = result.session.token
  return authSerializer.loginResultToOutput(result, token)
})
  .catch()
  .build()

const me = operation(authContract.me, async (_input, context: AuthedORPCContext) => {
  const userId = context.auth?.userId
  if (!userId) throw new Error('Not authenticated')

  const sessionToken = extractBearerToken(context)
  if (!sessionToken) throw new Error('No session token')

  const result = await authService.me(userId, sessionToken)
  return authSerializer.meResultToOutput(result)
})
  .use(authMiddleware)
  .catch()
  .build()

const logout = operation(authContract.logout, async (_input, context: AuthedORPCContext) => {
  const sessionToken = extractBearerToken(context)
  if (!sessionToken) throw new Error('No session token')

  await authService.logout(sessionToken)
  return { success: true }
})
  .use(authMiddleware)
  .catch()
  .build()

export const authOperations = { register, login, me, logout }
