import { oc } from '@orpc/contract'
import { createProjectInput, projectOutput } from '@workspace/schemas'

export const routes = {
  projects: {
    create: oc
      .route({ method: 'POST', path: '/projects' })
      .input(createProjectInput)
      .output(projectOutput),
  },
}
