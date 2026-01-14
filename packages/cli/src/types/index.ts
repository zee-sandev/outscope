export interface CreateProjectOptions {
  projectName: string
  template: 'beta' | 'monorepo'
  includePrisma: boolean
  installDependencies: boolean
  initDatabase: boolean
}

export interface GenerateOptions {
  type: 'feature' | 'controller' | 'service' | 'repository'
  name: string
  feature?: string // Required for controller/service/repository
}

export type PackageManager = 'pnpm' | 'npm' | 'yarn'

export interface TemplateContext {
  projectName: string
  description: string
  includePrisma: boolean
  templateRootPath?: string
}
