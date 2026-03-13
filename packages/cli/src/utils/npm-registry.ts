import { readFile } from 'fs/promises'

interface NpmPackageInfo {
  version?: string
}

export interface OutdatedPackage {
  packageName: string
  currentVersion: string
  latestVersion: string
}

function parseBaseVersion(version: string): string {
  return version.replace(/^[\^~>=<]/, '').trim()
}

/**
 * Fetch latest version of a package from npm registry
 */
export async function getLatestVersion(packageName: string): Promise<string | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`)
    if (!response.ok) {
      return null
    }
    const data = (await response.json()) as NpmPackageInfo
    return data.version || null
  } catch (error) {
    console.warn(`Failed to fetch latest version for ${packageName}:`, error)
    return null
  }
}

/**
 * Find outdated packages across multiple package.json files.
 * Returns unique packages where base version differs from npm latest.
 */
export async function findOutdatedPackages(pkgJsonPaths: string[]): Promise<OutdatedPackage[]> {
  const versionCache = new Map<string, string | null>()
  const seen = new Map<string, OutdatedPackage>()

  for (const filePath of pkgJsonPaths) {
    let pkg: Record<string, any>
    try {
      const content = await readFile(filePath, 'utf-8')
      pkg = JSON.parse(content)
    } catch {
      continue
    }

    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }

    const fetchTasks = Object.entries(allDeps).map(async ([name, version]) => {
      if (typeof version !== 'string') return
      if (name.startsWith('@workspace/')) return
      if (version.startsWith('workspace:')) return
      if (seen.has(name)) return

      const base = parseBaseVersion(version)
      if (!base || base === '*') return

      let latest = versionCache.get(name)
      if (latest === undefined) {
        latest = await getLatestVersion(name)
        versionCache.set(name, latest)
      }

      if (latest && latest !== base) {
        seen.set(name, { packageName: name, currentVersion: version, latestVersion: latest })
      }
    })

    await Promise.all(fetchTasks)
  }

  return [...seen.values()]
}

/**
 * Resolve workspace:* dependency to latest published version
 * Skips @workspace/* packages as they are local workspace packages
 */
export async function resolveWorkspaceDependency(
  packageName: string,
  currentVersion: string
): Promise<string> {
  // Skip @workspace/* packages - they're local workspace packages
  if (packageName.startsWith('@workspace/')) {
    return currentVersion
  }

  if (currentVersion === 'workspace:*' || currentVersion === 'workspace:^') {
    const latestVersion = await getLatestVersion(packageName)
    return latestVersion ? `^${latestVersion}` : '^0.1.0' // Fallback to ^0.1.0
  }
  return currentVersion
}
