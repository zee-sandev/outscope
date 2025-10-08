import { resolve } from 'path'
import pc from 'picocolors'
import ora from 'ora'
import { promptCreateProject } from '../utils/prompts.js'
import {
  copyTemplate,
  directoryExists,
  isDirectoryEmpty,
} from '../utils/file-operations.js'
import {
  detectPackageManager,
  installDependencies,
  runScript,
  getInstallCommand,
  getRunCommand,
} from '../utils/package-manager.js'
import {
  downloadTemplateFromGitHub,
  getTemplateConfig,
  cleanupTempDir,
} from '../utils/github-downloader.js'
import type { TemplateContext } from '../types/index.js'

/**
 * Create a new project from template
 */
export async function createProject(projectName?: string): Promise<void> {
  console.log(pc.cyan(pc.bold('\n🎺 Welcome to Horn CLI!\n')))

  // Get project options from user
  const options = await promptCreateProject(projectName)

  const targetPath = resolve(process.cwd(), options.projectName)

  // Check if directory exists
  if (await directoryExists(targetPath)) {
    const isEmpty = await isDirectoryEmpty(targetPath)
    if (!isEmpty) {
      console.error(
        pc.red(`\n✗ Directory "${options.projectName}" already exists and is not empty.\n`)
      )
      process.exit(1)
    }
  }

  // Download template from GitHub
  const downloadSpinner = ora('Downloading template from GitHub...').start()
  let templatePath: string
  try {
    const templateConfig = getTemplateConfig(options.template)
    templatePath = await downloadTemplateFromGitHub(templateConfig)
    downloadSpinner.succeed(pc.green('Template downloaded'))
  } catch (error) {
    downloadSpinner.fail(pc.red('Failed to download template'))
    console.error(error)
    process.exit(1)
  }

  // Check if template exists
  if (!(await directoryExists(templatePath))) {
    console.error(pc.red(`\n✗ Template "${options.template}" not found in repository.\n`))
    await cleanupTempDir(templatePath)
    process.exit(1)
  }

  // Create template context
  const context: TemplateContext = {
    projectName: options.projectName,
    description: `A project built with @horn/orpc-hono`,
    includePrisma: options.includePrisma,
  }

  // Copy template
  const copySpinner = ora('Copying template files...').start()
  try {
    await copyTemplate(templatePath, targetPath, context)
    copySpinner.succeed(pc.green('Template files copied'))
  } catch (error) {
    copySpinner.fail(pc.red('Failed to copy template'))
    console.error(error)
    process.exit(1)
  }

  // Detect package manager
  const packageManager = await detectPackageManager()
  console.log(pc.dim(`\nUsing ${packageManager} as package manager`))

  // Install dependencies if requested
  if (options.installDependencies) {
    const installSpinner = ora('Installing dependencies...').start()
    try {
      await installDependencies(targetPath, packageManager)
      installSpinner.succeed(pc.green('Dependencies installed'))
    } catch (error) {
      installSpinner.fail(pc.red('Failed to install dependencies'))
      console.error(error)
      process.exit(1)
    }

    // Generate Prisma client if included
    if (options.includePrisma) {
      const prismaSpinner = ora('Generating Prisma client...').start()
      try {
        await runScript(targetPath, 'db:generate', packageManager)
        prismaSpinner.succeed(pc.green('Prisma client generated'))
      } catch (error) {
        prismaSpinner.fail(pc.red('Failed to generate Prisma client'))
        console.error(error)
      }

      // Initialize database if requested
      if (options.initDatabase) {
        const dbSpinner = ora('Initializing database...').start()
        try {
          await runScript(targetPath, 'db:push', packageManager)
          dbSpinner.succeed(pc.green('Database initialized'))
        } catch (error) {
          dbSpinner.fail(pc.red('Failed to initialize database'))
          console.error(error)
        }
      }
    }
  }

  // Success message
  console.log(pc.green(pc.bold('\n✓ Project created successfully!\n')))

  // Next steps
  console.log(pc.cyan('Next steps:\n'))
  console.log(`  ${pc.dim('$')} ${pc.cyan(`cd ${options.projectName}`)}`)

  if (!options.installDependencies) {
    console.log(`  ${pc.dim('$')} ${pc.cyan(getInstallCommand(packageManager))}`)
    if (options.includePrisma) {
      console.log(`  ${pc.dim('$')} ${pc.cyan(getRunCommand(packageManager, 'db:generate'))}`)
      console.log(`  ${pc.dim('$')} ${pc.cyan(getRunCommand(packageManager, 'db:push'))}`)
    }
  } else if (options.includePrisma && !options.initDatabase) {
    console.log(`  ${pc.dim('$')} ${pc.cyan(getRunCommand(packageManager, 'db:push'))}`)
  }

  console.log(`  ${pc.dim('$')} ${pc.cyan(getRunCommand(packageManager, 'dev'))}`)
  console.log()

  // Cleanup temp directory
  await cleanupTempDir(templatePath)
}
