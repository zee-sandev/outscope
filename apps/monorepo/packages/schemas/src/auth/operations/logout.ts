import { z } from 'zod'

export const LogoutInputSchema = z.object({})

export type LogoutInput = z.infer<typeof LogoutInputSchema>

export const LogoutOutputSchema = z.object({
  success: z.boolean(),
})

export type LogoutOutput = z.infer<typeof LogoutOutputSchema>
