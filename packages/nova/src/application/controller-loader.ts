import path from 'node:path'
import { isController } from '../infrastructure/metadata'

/**
 * Controller class constructor type
 */
export type ControllerClass = new (...args: unknown[]) => unknown

/**
 * Options for loading controllers
 */
export interface ControllerLoaderOptions {
  /** Working directory for relative patterns (defaults to process.cwd()) */
  cwd?: string
  /** Logger for debug messages */
  logger?: {
    debug?: (message: string, ...args: unknown[]) => void
    warn?: (message: string, ...args: unknown[]) => void
  }
}

/**
 * Dependency injection container interface
 */
export interface DependencyContainer {
  resolve<T>(token: ControllerClass): T
}

/**
 * Load controller classes from a glob pattern.
 * Uses dynamic import to load modules from matched files.
 *
 * @param pattern - Glob pattern to match controller files (e.g., 'src/features/**\/*.controller.ts')
 * @param options - Optional configuration
 * @returns Array of controller class constructors
 *
 * @example
 * ```typescript
 * // Load all controllers from features directory
 * const controllers = await loadControllers('src/features/**\/*.controller.ts')
 *
 * // With custom working directory
 * const controllers = await loadControllers('**\/*.controller.ts', { cwd: './src' })
 * ```
 */
export async function loadControllers(
  pattern: string,
  options?: ControllerLoaderOptions
): Promise<ControllerClass[]> {
  // Dynamic import glob to support optional dependency
  let globSync: (pattern: string, options?: { absolute?: boolean; cwd?: string }) => string[]
  try {
    const glob = await import('glob')
    globSync = glob.globSync
  } catch {
    throw new Error(
      'The "glob" package is required for automatic controller loading. ' +
        'Install it with: npm install glob'
    )
  }

  const controllers: ControllerClass[] = []
  const cwd = options?.cwd ?? process.cwd()
  const files = globSync(pattern, { absolute: false, cwd })

  for (const file of files) {
    try {
      // Convert to absolute path for import
      const absolutePath = path.resolve(cwd, file)
      const importPath =
        process.platform === 'win32'
          ? `file:///${absolutePath.replace(/\\/g, '/')}`
          : `file://${absolutePath}`

      const module = await import(importPath)

      // Find all exports that are controller classes
      for (const key of Object.keys(module)) {
        const exported = module[key]

        // Check if it's a class constructor
        if (typeof exported === 'function' && exported.prototype) {
          // Check for @Controller decorator metadata or naming convention
          if (isController(exported) || key.endsWith('Controller')) {
            controllers.push(exported)
            options?.logger?.debug?.(`Loaded controller: ${key}`)
          }
        }
      }
    } catch (error) {
      options?.logger?.warn?.(`Failed to load controller from ${file}:`, error)
    }
  }

  return controllers
}

/**
 * Instantiate controller classes.
 * Supports optional dependency injection container.
 *
 * @param classes - Array of controller class constructors
 * @param container - Optional dependency injection container
 * @returns Array of controller instances
 *
 * @example
 * ```typescript
 * // Simple instantiation
 * const controllers = instantiateControllers(controllerClasses)
 *
 * // With dependency injection
 * const controllers = instantiateControllers(controllerClasses, myContainer)
 * ```
 */
export function instantiateControllers(
  classes: ControllerClass[],
  container?: DependencyContainer
): unknown[] {
  return classes.map((Controller) => {
    if (container) {
      return container.resolve(Controller)
    }
    return new Controller()
  })
}

/**
 * Load and instantiate controllers in one step.
 * Convenience function combining loadControllers and instantiateControllers.
 *
 * @param pattern - Glob pattern to match controller files
 * @param options - Loader options
 * @param container - Optional dependency injection container
 * @returns Array of controller instances
 */
export async function loadAndInstantiateControllers(
  pattern: string,
  options?: ControllerLoaderOptions,
  container?: DependencyContainer
): Promise<unknown[]> {
  const classes = await loadControllers(pattern, options)
  return instantiateControllers(classes, container)
}
