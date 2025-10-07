// import type { z } from 'zod'
import { implement, ORPCError } from '@orpc/server'
import { contract } from '../../contracts'
import type { ORPCContext } from './context'

export const pub = implement(contract)
  .$context<ORPCContext>()

// export const authed = pub.use(({ context, next }) => {
//   if (!context.user) {
//     throw new ORPCError('UNAUTHORIZED')
//   }

//   return next({
//     context: {
//       user: context.user,
//     },
//   })
// })
