import { z } from 'zod'

export const createProjectInput = z.object({
  name: z.string().min(1),
})

export const projectOutput = z.object({
  id: z.string(),
  name: z.string(),
})

export type CreateProjectInput = z.infer<typeof createProjectInput>
export type ProjectOutput = z.infer<typeof projectOutput>
