import { z } from 'zod'

export const createTaskInput = z.object({
  title: z.string().min(1),
})

export const taskOutput = z.object({
  id: z.string(),
  title: z.string(),
  createdBy: z.string(),
})

export type CreateTaskInput = z.infer<typeof createTaskInput>
