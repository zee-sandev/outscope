#!/usr/bin/env node

import { Command } from 'commander'
import pc from 'picocolors'
import { createRequire } from 'module'
import { createProject } from './commands/create.js'
import { generate } from './commands/generate.js'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')

const program = new Command()

program
  .name('outscope')
  .description('CLI tool for scaffolding @outscope/orpc-hono projects')
  .version(pkg.version)

// Create command
program
  .command('create [project-name]')
  .description('Create a new Outscope project')
  .option('-t, --template <template>', 'Template to use (beta)', 'beta')
  .action(async (projectName: string | undefined) => {
    try {
      await createProject(projectName)
    } catch (error) {
      console.error(pc.red('\n✗ Error creating project:'))
      console.error(error)
      process.exit(1)
    }
  })

// Generate command
program
  .command('generate [type] [name]')
  .alias('g')
  .description(
    'Generate code files\n' +
      '  Available types:\n' +
      '    - feature: Complete feature module (controller + service + repository + contracts + schema)\n' +
      '    - controller: Controller file only\n' +
      '    - service: Service file only\n' +
      '    - repository: Repository file only'
  )
  .action(async (type: string | undefined, name: string | undefined) => {
    try {
      await generate(type, name)
    } catch (error) {
      console.error(pc.red('\n✗ Error generating code:'))
      console.error(error)
      process.exit(1)
    }
  })

// Parse arguments
program.parse(process.argv)

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
