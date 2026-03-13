import { z } from 'zod'
import { UserSchema, SessionSchema, OrganizationSchema } from '../entity'

export const MeInputSchema = z.object({})

export type MeInput = z.infer<typeof MeInputSchema>

// Reuse entity schemas with only needed fields
export const MeOutputSchema = z.object({
  user: UserSchema,
  session: SessionSchema.pick({
    id: true,
    userId: true,
    expiresAt: true,
    activeOrganizationId: true,
  }),
  organizations: z.array(
    OrganizationSchema.pick({
      id: true,
      name: true,
      slug: true,
    }).extend({
      role: z.string(),
    })
  ),
})

export type MeOutput = z.infer<typeof MeOutputSchema>
