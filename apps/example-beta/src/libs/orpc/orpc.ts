import { implement, ORPCError } from '@orpc/server'
import { contract } from '../../contracts'
import type { ORPCContext, User } from './context'

export const pub = implement(contract).$context<ORPCContext>()

// Middleware function for authentication
export const authMiddleware = ({ next, context }: { next: any; context: ORPCContext }) => {
  // Mock authentication - in production, this would:
  // 1. Extract token from headers/cookies
  // 2. Validate token with auth service
  // 3. Fetch user from database

  // For testing: simulate authenticated user
  // Set to undefined to test UNAUTHORIZED error
  const mockUser: User | undefined = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
  }
  // Uncomment to test UNAUTHORIZED:
  // const mockUser: User | undefined = undefined

  if (!mockUser) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'User not authenticated',
    })
  }

  return next({
    context: {
      ...context,
      user: mockUser,
    },
  })
}

// Apply middleware to create authed implementer
export const authed = pub.use(authMiddleware)


// Create router structure by accessing the user property from authedMiddleware
// authedMiddleware is based on pub which has the full contract structure
// export const authed = {
//   getCurrentUser: authedMiddleware.user.getCurrentUser
// }
