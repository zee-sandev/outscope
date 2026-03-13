import { z } from 'zod'
import { UserSchema, SessionSchema } from '../entity'

export const LoginInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof LoginInputSchema>

// Reuse entity schemas with only needed fields
export const LoginOutputSchema = z.object({
  user: UserSchema,
  session: SessionSchema.pick({
    id: true,
    userId: true,
    expiresAt: true,
    token: true,
    activeOrganizationId: true,
  }),
})

export type LoginOutput = z.infer<typeof LoginOutputSchema>
