import { execa } from 'execa'
import type { PackageManager } from '../types/index.js'

/**
 * Detect which package manager is available
 */
export async function detectPackageManager(): Promise<PackageManager> {
  // Check for pnpm first (preferred)
  try {
    await execa('pnpm', ['--version'])
    return 'pnpm'
  } catch {
    // Fall back to npm
    try {
      await execa('npm', ['--version'])
      return 'npm'
    } catch {
      // Fall back to yarn
      try {
        await execa('yarn', ['--version'])
        return 'yarn'
      } catch {
        // Default to npm
        return 'npm'
      }
    }
  }
}

/**
 * Install dependencies using detected package manager
 */
export async function installDependencies(
  projectPath: string,
  packageManager: PackageManager
): Promise<void> {
  const installCommand = packageManager === 'yarn' ? 'install' : 'install'

  await execa(packageManager, [installCommand], {
    cwd: projectPath,
    stdio: 'inherit',
  })
}

/**
 * Run a package.json script
 */
export async function runScript(
  projectPath: string,
  scriptName: string,
  packageManager: PackageManager
): Promise<void> {
  const runCommand = packageManager === 'npm' ? 'run' : packageManager === 'yarn' ? '' : 'run'

  const args = runCommand ? [runCommand, scriptName] : [scriptName]

  await execa(packageManager, args, {
    cwd: projectPath,
    stdio: 'inherit',
  })
}

/**
 * Get install command string for display
 */
export function getInstallCommand(packageManager: PackageManager): string {
  return `${packageManager} install`
}

/**
 * Get run script command string for display
 */
export function getRunCommand(packageManager: PackageManager, script: string): string {
  if (packageManager === 'npm') {
    return `npm run ${script}`
  } else if (packageManager === 'yarn') {
    return `yarn ${script}`
  } else {
    return `pnpm ${script}`
  }
}
