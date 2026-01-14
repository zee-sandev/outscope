import { z } from 'zod'
import { UserSchema, SessionSchema, OrganizationSchema } from '../entity'

export const RegisterInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  organizationName: z.string().min(1, 'Organization name is required').optional(),
})

export type RegisterInput = z.infer<typeof RegisterInputSchema>

// Reuse entity schemas with only needed fields
export const RegisterOutputSchema = z.object({
  user: UserSchema.omit({ image: true }),
  session: SessionSchema.pick({
    id: true,
    userId: true,
    expiresAt: true,
    token: true,
    activeOrganizationId: true,
  }),
  organization: OrganizationSchema.pick({
    id: true,
    name: true,
    slug: true,
  }).nullable().optional(),
})

export type RegisterOutput = z.infer<typeof RegisterOutputSchema>
