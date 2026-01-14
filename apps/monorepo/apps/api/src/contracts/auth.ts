import { oc } from '@orpc/contract'
import {
  RegisterInputSchema,
  RegisterOutputSchema,
  LoginInputSchema,
  LoginOutputSchema,
  MeInputSchema,
  MeOutputSchema,
  LogoutInputSchema,
  LogoutOutputSchema,
} from '@schemas/auth'

export const register = oc
  .route({
    method: 'POST',
    path: '/auth/register',
    summary: 'Register a new user',
    description: 'Create a new user account with email and password',
    tags: ['Auth'],
  })
  .input(RegisterInputSchema)
  .output(RegisterOutputSchema)

export const login = oc
  .route({
    method: 'POST',
    path: '/auth/login',
    summary: 'Login user',
    description: 'Authenticate user with email and password',
    tags: ['Auth'],
  })
  .input(LoginInputSchema)
  .output(LoginOutputSchema)

export const me = oc
  .route({
    method: 'GET',
    path: '/auth/me',
    summary: 'Get current user',
    description: 'Get the currently authenticated user information',
    tags: ['Auth'],
  })
  .input(MeInputSchema)
  .output(MeOutputSchema)

export const logout = oc
  .route({
    method: 'POST',
    path: '/auth/logout',
    summary: 'Logout user',
    description: 'End the current user session',
    tags: ['Auth'],
  })
  .input(LogoutInputSchema)
  .output(LogoutOutputSchema)

export const auth = {
  register,
  login,
  me,
  logout,
}
