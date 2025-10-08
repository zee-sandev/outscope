import { oc } from '@orpc/contract'
import {
  GetCurrentUserInput,
  GetCurrentUserOutput,
} from '../schemas/user'

export const getCurrentUser = oc
  .route({
    method: 'GET',
    path: '/users/me',
    summary: 'Get current user',
    description: 'Retrieve information about the authenticated user',
    tags: ['Users'],
    deprecated: false,
  })
  .input(GetCurrentUserInput)
  .output(GetCurrentUserOutput)

export const user = {
  getCurrentUser,
}
