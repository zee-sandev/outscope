import { globSync } from 'glob'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type ControllerClass = new () => any

export async function loadControllers(pattern: string): Promise<ControllerClass[]> {
  const controllers: ControllerClass[] = []
  const files = globSync(pattern, { absolute: false })

  console.log(`[Controller Loader] Found ${files.length} files matching pattern: ${pattern}`)

  for (const file of files) {
    try {
      // Convert to absolute path for import
      const absolutePath = path.resolve(file)
      const importPath = process.platform === 'win32'
        ? `file:///${absolutePath.replace(/\\/g, '/')}`
        : `file://${absolutePath}`

      console.log(`[Controller Loader] Loading: ${file}`)
      const module = await import(importPath)

      // Find all exports that are classes with @Controller decorator
      for (const key of Object.keys(module)) {
        const exported = module[key]

        // Check if it's a class constructor
        if (typeof exported === 'function' && exported.prototype) {
          console.log(`[Controller Loader] Found class export: ${key}`)

          // Try to check metadata if available, otherwise assume it's a controller
          const hasMetadata = typeof Reflect.hasMetadata === 'function'
            ? Reflect.hasMetadata('orpc:controller', exported)
            : true // Fallback: assume it's a controller if metadata not available

          if (hasMetadata || key.includes('Controller')) {
            console.log(`[Controller Loader] ✓ Registered controller: ${key}`)
            controllers.push(exported)
          }
        }
      }
    } catch (error) {
      console.error(`[Controller Loader] Failed to load controller from ${file}:`, error)
    }
  }

  console.log(`[Controller Loader] Total controllers loaded: ${controllers.length}`)
  return controllers
}
