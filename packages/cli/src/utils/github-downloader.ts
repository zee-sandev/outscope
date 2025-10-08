import { pipeline } from 'stream/promises'
import { createWriteStream } from 'fs'
import { mkdir, mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { extract } from 'tar'
import { Readable } from 'stream'

interface DownloadTemplateOptions {
  owner: string
  repo: string
  branch?: string
  templatePath: string
}

/**
 * Download and extract template from GitHub
 */
export async function downloadTemplateFromGitHub(
  options: DownloadTemplateOptions
): Promise<string> {
  const { owner, repo, branch = 'main', templatePath } = options

  // Create temp directory
  const tempDir = await mkdtemp(join(tmpdir(), 'horn-template-'))

  try {
    // Download tarball from GitHub
    const tarballUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.tar.gz`

    const response = await fetch(tarballUrl)
    if (!response.ok) {
      throw new Error(`Failed to download template: ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    // Extract tarball
    const extractPath = join(tempDir, 'extracted')
    await mkdir(extractPath, { recursive: true })

    // Convert Web ReadableStream to Node.js Readable
    const nodeStream = Readable.fromWeb(response.body as any)

    // Extract tar.gz
    await pipeline(
      nodeStream,
      extract({
        cwd: extractPath,
        strip: 0, // Keep the root folder (repo-name-branch)
      })
    )

    // The extracted folder will be named like "horn-main"
    const extractedFolderName = `${repo}-${branch}`
    const templateFullPath = join(extractPath, extractedFolderName, templatePath)

    return templateFullPath
  } catch (error) {
    // Cleanup on error
    await rm(tempDir, { recursive: true, force: true })
    throw error
  }
}

/**
 * Get template configuration for known templates
 */
export function getTemplateConfig(template: string): DownloadTemplateOptions {
  const templates: Record<string, DownloadTemplateOptions> = {
    beta: {
      owner: 'zee-sandev',
      repo: 'horn',
      branch: 'main',
      templatePath: 'apps/example-beta',
    },
  }

  const config = templates[template]
  if (!config) {
    throw new Error(`Unknown template: ${template}`)
  }

  return config
}

/**
 * Cleanup temporary directory
 */
export async function cleanupTempDir(tempPath: string): Promise<void> {
  try {
    // Extract the temp dir root (everything before /extracted)
    const tempRoot = tempPath.split('/extracted')[0]
    await rm(tempRoot, { recursive: true, force: true })
  } catch (error) {
    // Ignore cleanup errors
    console.warn('Failed to cleanup temp directory:', error)
  }
}
