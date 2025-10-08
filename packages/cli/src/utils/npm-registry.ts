interface NpmPackageInfo {
  version?: string
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
 * Resolve workspace:* dependency to latest published version
 */
export async function resolveWorkspaceDependency(
  packageName: string,
  currentVersion: string
): Promise<string> {
  if (currentVersion === 'workspace:*') {
    const latestVersion = await getLatestVersion(packageName)
    return latestVersion ? `^${latestVersion}` : '^0.1.0' // Fallback to ^0.1.0
  }
  return currentVersion
}
