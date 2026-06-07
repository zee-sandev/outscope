import inquirer from 'inquirer'
import type { CreateProjectCliOptions, CreateProjectOptions, GenerateOptions } from '../types/index.js'

/**
 * Prompt user for create project options
 */
export async function promptCreateProject(
  projectName?: string,
  cliOptions: CreateProjectCliOptions = {}
): Promise<CreateProjectOptions> {
  if (cliOptions.yes) {
    return {
      projectName: projectName || 'my-outscope-app',
      template: cliOptions.template || 'nova-api',
      includePrisma: false,
      installDependencies: cliOptions.installDependencies ?? false,
      initDatabase: false,
    }
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: projectName || 'my-outscope-app',
      when: !projectName,
      validate: (input: string) => {
        if (!input) return 'Project name is required'
        if (!/^[a-z0-9-_]+$/.test(input)) {
          return 'Project name can only contain lowercase letters, numbers, dashes, and underscores'
        }
        return true
      },
    },
    {
      type: 'list',
      name: 'template',
      message: 'Select template:',
      choices: [
        { name: 'Nova API (decorator controllers)', value: 'nova-api' },
        { name: 'Nova Fn API (functional handlers)', value: 'nova-fn-api' },
        { name: 'Turbo Nova (monorepo + decorator API)', value: 'turbo-nova' },
        { name: 'Turbo Nova Fn (monorepo + functional API)', value: 'turbo-nova-fn' },
      ],
      default: 'nova-api',
      when: !cliOptions.template,
    },
    {
      type: 'confirm',
      name: 'installDependencies',
      message: 'Install dependencies?',
      default: true,
    },
  ])

  return {
    projectName: projectName || answers.projectName,
    template: cliOptions.template || answers.template || 'nova-api',
    includePrisma: false,
    installDependencies: cliOptions.installDependencies ?? answers.installDependencies,
    initDatabase: false,
  }
}

/**
 * Prompt user for generate options
 */
export async function promptGenerate(type?: string, name?: string): Promise<GenerateOptions> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'What do you want to generate?',
      choices: [
        { name: 'Feature (full CRUD)', value: 'feature' },
        { name: 'Controller', value: 'controller' },
        { name: 'Service', value: 'service' },
        { name: 'Repository', value: 'repository' },
      ],
      when: !type,
    },
    {
      type: 'input',
      name: 'name',
      message: (answers) => {
        const t = type || answers.type
        return `${t.charAt(0).toUpperCase() + t.slice(1)} name (singular, e.g., "user"):`
      },
      when: !name,
      validate: (input: string) => {
        if (!input) return 'Name is required'
        if (!/^[a-z][a-z0-9]*$/i.test(input)) {
          return 'Name must start with a letter and contain only letters and numbers'
        }
        return true
      },
    },
    {
      type: 'input',
      name: 'feature',
      message: 'Feature name (where to place the file):',
      when: (answers) => {
        const t = type || answers.type
        return t !== 'feature'
      },
      validate: (input: string) => {
        if (!input) return 'Feature name is required'
        return true
      },
    },
  ])

  return {
    type: type || answers.type,
    name: name || answers.name,
    feature: answers.feature,
  }
}
