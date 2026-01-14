import { readdir, cp, mkdir, readFile, writeFile, stat } from 'fs/promises'
import { join, dirname } from 'path'
import type { TemplateContext } from '../types/index.js'
import { resolveWorkspaceDependency } from './npm-registry.js'

const SKIP_FILES = ['.env', 'node_modules', 'dist', '.turbo', '*.db', '*.db-journal']
const SKIP_DIRS = ['node_modules', 'dist', '.turbo', 'src/generated']

/**
 * Check if a file/directory should be skipped
 */
function shouldSkip(path: string): boolean {
  const name = path.split('/').pop() || ''

  // Check exact matches
  if (SKIP_FILES.includes(name)) return true

  // Check patterns
  if (name.endsWith('.db') || name.endsWith('.db-journal')) return true

  // Check directory paths
  for (const skipDir of SKIP_DIRS) {
    if (path.includes(`/${skipDir}/`) || path.endsWith(`/${skipDir}`)) {
      return true
    }
  }

  return false
}

/**
 * Copy template directory to destination with selective filtering
 */
export async function copyTemplate(
  templatePath: string,
  destPath: string,
  context: TemplateContext
): Promise<void> {
  await mkdir(destPath, { recursive: true })

  const entries = await readdir(templatePath, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = join(templatePath, entry.name)
    const targetPath = join(destPath, entry.name)

    if (shouldSkip(sourcePath)) continue

    // Skip Prisma files if not included
    if (!context.includePrisma && entry.name === 'prisma') continue

    if (entry.isDirectory()) {
      await copyTemplate(sourcePath, targetPath, context)
    } else if (entry.isFile()) {
      await copyFile(sourcePath, targetPath, context)
    }
  }
}

/**
 * Copy and optionally transform a single file
 */
async function copyFile(
  sourcePath: string,
  targetPath: string,
  context: TemplateContext
): Promise<void> {
  const fileName = sourcePath.split('/').pop() || ''

  // Files that need transformation
  const needsTransform = ['package.json', 'README.md', 'pnpm-workspace.yaml']

  if (needsTransform.includes(fileName)) {
    await transformAndWriteFile(sourcePath, targetPath, context)
  } else {
    // Direct copy for other files
    await mkdir(dirname(targetPath), { recursive: true })
    await cp(sourcePath, targetPath)
  }
}

/**
 * Transform file content with template variables
 */
async function transformAndWriteFile(
  sourcePath: string,
  targetPath: string,
  context: TemplateContext
): Promise<void> {
  const content = await readFile(sourcePath, 'utf-8')
  const fileName = sourcePath.split('/').pop() || ''

  let transformed = content

  if (fileName === 'package.json') {
    const pkg = JSON.parse(content)

    // Only change name/description/version for root package.json
    const isRootPackage = context.templateRootPath
      ? sourcePath === join(context.templateRootPath, 'package.json')
      : false

    if (isRootPackage) {
      pkg.name = context.projectName
      pkg.description = context.description
      pkg.version = '0.1.0'
    }

    // Resolve workspace:* dependencies to published versions
    if (pkg.dependencies) {
      for (const [depName, depVersion] of Object.entries(pkg.dependencies)) {
        if (typeof depVersion === 'string') {
          pkg.dependencies[depName] = await resolveWorkspaceDependency(depName, depVersion)
        }
      }
    }

    // Resolve workspace:* devDependencies to published versions
    if (pkg.devDependencies) {
      for (const [depName, depVersion] of Object.entries(pkg.devDependencies)) {
        if (typeof depVersion === 'string') {
          pkg.devDependencies[depName] = await resolveWorkspaceDependency(depName, depVersion)
        }
      }
    }

    // Remove Prisma dependencies if not included
    if (!context.includePrisma) {
      delete pkg.dependencies['@prisma/client']
      delete pkg.dependencies['prisma']
      delete pkg.scripts['db:generate']
      delete pkg.scripts['db:push']
      delete pkg.scripts['db:migrate']
      delete pkg.scripts['db:studio']
    }

    transformed = JSON.stringify(pkg, null, 2)
  } else if (fileName === 'README.md') {
    // Replace project name in README
    transformed = content
      .replace(/@outscope\/orpc-hono Example/g, `${context.projectName}`)
      .replace(/example-beta/g, context.projectName)
  } else if (fileName === 'pnpm-workspace.yaml') {
    // Remove invalid parent references (e.g., ../../packages/*)
    transformed = content
      .split('\n')
      .filter(line => !line.includes('../../packages'))
      .join('\n')
  }

  await mkdir(dirname(targetPath), { recursive: true })
  await writeFile(targetPath, transformed, 'utf-8')
}

/**
 * Check if directory exists
 */
export async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path)
    return stats.isDirectory()
  } catch {
    return false
  }
}

/**
 * Check if directory is empty
 */
export async function isDirectoryEmpty(path: string): Promise<boolean> {
  try {
    const entries = await readdir(path)
    return entries.length === 0
  } catch {
    return true
  }
}
