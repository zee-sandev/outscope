import { Controller, Implement, Middleware, CatchErrors, extractBearerToken } from '@outscope/orpc-hono'
import { auth as authContract } from '@contracts/auth'
import type {
  RegisterInput,
  RegisterOutput,
  LoginInput,
  LoginOutput,
  MeInput,
  MeOutput,
  LogoutInput,
  LogoutOutput,
} from '@schemas/auth'
import type { ORPCContext, AuthedORPCContext } from '@libs/orpc/context'
import { authMiddleware } from '@libs/orpc/orpc'
import { authService } from './auth.service'
import { authSerializer } from './auth.serializer'

@Controller()
export class AuthController {
  @CatchErrors()
  @Implement(authContract.register)
  async register(input: RegisterInput, _context: ORPCContext): Promise<RegisterOutput> {
    const result = await authService.register(input)
    const token = result.session.token
    return authSerializer.registerResultToOutput(result, token)
  }

  @CatchErrors()
  @Implement(authContract.login)
  async login(input: LoginInput, _context: ORPCContext): Promise<LoginOutput> {
    const result = await authService.login(input)
    const token = result.session.token
    return authSerializer.loginResultToOutput(result, token)
  }

  @CatchErrors()
  @Middleware(authMiddleware)
  @Implement(authContract.me)
  async me(_input: MeInput, context: AuthedORPCContext): Promise<MeOutput> {
    const userId = context.auth?.userId
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const sessionToken = extractBearerToken(context)
    if (!sessionToken) {
      throw new Error('No session token')
    }

    const result = await authService.me(userId, sessionToken)
    return authSerializer.meResultToOutput(result)
  }

  @CatchErrors()
  @Middleware(authMiddleware)
  @Implement(authContract.logout)
  async logout(_input: LogoutInput, context: AuthedORPCContext): Promise<LogoutOutput> {
    const sessionToken = extractBearerToken(context)
    if (!sessionToken) {
      throw new Error('No session token')
    }

    await authService.logout(sessionToken)
    return { success: true }
  }
}
