export interface CreateProjectOptions {
  projectName: string
  template: 'nova-api' | 'nova-fn-api' | 'turbo-nova' | 'turbo-nova-fn'
  includePrisma: boolean
  installDependencies: boolean
  initDatabase: boolean
}

export interface CreateProjectCliOptions {
  template?: CreateProjectOptions['template']
  yes?: boolean
  installDependencies?: boolean
  skipRepomix?: boolean
  skipOutdatedCheck?: boolean
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
