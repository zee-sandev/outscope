import { Controller, Implement, Implementer } from '@horn/orpc-hono'
import { user } from '@contracts/user'
import { authed } from '@libs/orpc/orpc'
import type { User } from '@libs/orpc/context'
import type {
  GetCurrentUserInput,
  GetCurrentUserOutput,
} from '@schemas/user'

@Controller()
@Implementer(authed)
export class UserController {
  @Implement(user.getCurrentUser)
  async getCurrentUser(
    input: GetCurrentUserInput,
    context: { user: User }
  ): Promise<GetCurrentUserOutput> {
    // Log to verify that user data is passed through context
    console.log('=== UserController.getCurrentUser ===')
    console.log('User from context:', context.user)
    console.log('User ID:', context.user.id)
    console.log('User Name:', context.user.name)
    console.log('User Email:', context.user.email)
    console.log('User Role:', context.user.role)

    // Return the authenticated user from context
    return context.user
  }
}
