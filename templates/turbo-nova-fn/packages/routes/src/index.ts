import { oc } from '@orpc/contract'
import { createTaskInput, taskOutput } from '@workspace/schemas'

export const routes = {
  tasks: {
    mine: oc
      .route({ method: 'GET', path: '/tasks/mine' })
      .output(taskOutput.array()),
    create: oc
      .route({ method: 'POST', path: '/tasks' })
      .input(createTaskInput)
      .output(taskOutput),
  },
}
