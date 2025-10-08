import { join, resolve } from 'path'
import pc from 'picocolors'
import ora from 'ora'
import { promptGenerate } from '../utils/prompts.js'
import {
  generateController,
  generateService,
  generateRepository,
  generateContract,
  generateSchema,
  generateFeatureIndex,
  writeGeneratedFile,
  fileExists,
  toKebabCase,
  toPascalCase,
} from '../utils/code-generator.js'

/**
 * Generate code files (feature, controller, service, repository)
 */
export async function generate(type?: string, name?: string): Promise<void> {
  console.log(pc.cyan(pc.bold('\n🎺 Horn Code Generator\n')))

  // Get generation options
  const options = await promptGenerate(type, name)

  const cwd = process.cwd()

  // Check if we're in a Horn project
  const packageJsonPath = join(cwd, 'package.json')
  if (!(await fileExists(packageJsonPath))) {
    console.error(pc.red('\n✗ No package.json found. Are you in a Horn project?\n'))
    process.exit(1)
  }

  const spinner = ora('Generating files...').start()

  try {
    if (options.type === 'feature') {
      await generateFeature(cwd, options.name)
      spinner.succeed(pc.green(`Feature "${options.name}" generated successfully`))
    } else if (options.type === 'controller') {
      if (!options.feature) {
        spinner.fail(pc.red('Feature name is required for controller generation'))
        process.exit(1)
      }
      await generateSingleFile(cwd, 'controller', options.name, options.feature)
      spinner.succeed(pc.green(`Controller "${options.name}" generated successfully`))
    } else if (options.type === 'service') {
      if (!options.feature) {
        spinner.fail(pc.red('Feature name is required for service generation'))
        process.exit(1)
      }
      await generateSingleFile(cwd, 'service', options.name, options.feature)
      spinner.succeed(pc.green(`Service "${options.name}" generated successfully`))
    } else if (options.type === 'repository') {
      if (!options.feature) {
        spinner.fail(pc.red('Feature name is required for repository generation'))
        process.exit(1)
      }
      await generateSingleFile(cwd, 'repository', options.name, options.feature)
      spinner.succeed(pc.green(`Repository "${options.name}" generated successfully`))
    }

    // Show generated files
    console.log(pc.dim('\nGenerated files:'))
    if (options.type === 'feature') {
      const featurePath = `src/features/${toKebabCase(options.name)}s`
      console.log(pc.cyan(`  ${featurePath}/${toKebabCase(options.name)}.controller.ts`))
      console.log(pc.cyan(`  ${featurePath}/${toKebabCase(options.name)}.service.ts`))
      console.log(pc.cyan(`  ${featurePath}/${toKebabCase(options.name)}.repository.ts`))
      console.log(pc.cyan(`  ${featurePath}/index.ts`))
      console.log(pc.cyan(`  src/contracts/${toKebabCase(options.name)}.ts`))
      console.log(pc.cyan(`  src/schemas/${toKebabCase(options.name)}.ts`))
    } else {
      const featurePath = `src/features/${toKebabCase(options.feature!)}`
      console.log(
        pc.cyan(`  ${featurePath}/${toKebabCase(options.name)}.${options.type}.ts`)
      )
    }

    console.log(
      pc.yellow('\n💡 Don\'t forget to update your contract exports in src/contracts/index.ts\n')
    )
  } catch (error) {
    spinner.fail(pc.red('Failed to generate files'))
    console.error(error)
    process.exit(1)
  }
}

/**
 * Generate a complete feature (controller, service, repository, contract, schema)
 */
async function generateFeature(cwd: string, name: string): Promise<void> {
  const kebabName = toKebabCase(name)
  const featurePath = join(cwd, 'src', 'features', `${kebabName}s`)

  // Generate controller
  const controllerPath = join(featurePath, `${kebabName}.controller.ts`)
  const controllerContent = generateController(name, `${kebabName}s`)
  await writeGeneratedFile(controllerPath, controllerContent)

  // Generate service
  const servicePath = join(featurePath, `${kebabName}.service.ts`)
  const serviceContent = generateService(name)
  await writeGeneratedFile(servicePath, serviceContent)

  // Generate repository
  const repositoryPath = join(featurePath, `${kebabName}.repository.ts`)
  const repositoryContent = generateRepository(name)
  await writeGeneratedFile(repositoryPath, repositoryContent)

  // Generate index
  const indexPath = join(featurePath, 'index.ts')
  const indexContent = generateFeatureIndex(name)
  await writeGeneratedFile(indexPath, indexContent)

  // Generate contract
  const contractPath = join(cwd, 'src', 'contracts', `${kebabName}.ts`)
  const contractContent = generateContract(name)
  await writeGeneratedFile(contractPath, contractContent)

  // Generate schema
  const schemaPath = join(cwd, 'src', 'schemas', `${kebabName}.ts`)
  const schemaContent = generateSchema(name)
  await writeGeneratedFile(schemaPath, schemaContent)
}

/**
 * Generate a single file (controller, service, or repository)
 */
async function generateSingleFile(
  cwd: string,
  type: 'controller' | 'service' | 'repository',
  name: string,
  featureName: string
): Promise<void> {
  const kebabName = toKebabCase(name)
  const featurePath = join(cwd, 'src', 'features', toKebabCase(featureName))

  let content: string
  let filePath: string

  if (type === 'controller') {
    content = generateController(name, featureName)
    filePath = join(featurePath, `${kebabName}.controller.ts`)
  } else if (type === 'service') {
    content = generateService(name)
    filePath = join(featurePath, `${kebabName}.service.ts`)
  } else {
    content = generateRepository(name)
    filePath = join(featurePath, `${kebabName}.repository.ts`)
  }

  // Check if file already exists
  if (await fileExists(filePath)) {
    console.warn(pc.yellow(`\n⚠ File already exists: ${filePath}`))
    console.warn(pc.yellow('Skipping...\n'))
    return
  }

  await writeGeneratedFile(filePath, content)
}
