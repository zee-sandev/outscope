import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url)

const files = [
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'QUICKSTART.md',
  'llms.txt',
  ...walk('docs', ['.md']),
  ...walk('templates', ['.md', '.txt', '.ts', '.tsx', '.json']),
  ...walk('packages/cli/src', ['.ts', '.tsx']),
  'packages/cli/README.md',
  'packages/nova/README.md',
  'packages/nova-fn/README.md',
]

const checks = [
  {
    name: 'src/contracts path',
    pattern: /\bsrc\/contracts\b/,
    allow: negativeGuidance,
  },
  {
    name: '@contracts alias',
    pattern: /@contracts\b/,
    allow: negativeGuidance,
  },
  {
    name: '@Implement decorator',
    pattern: /@Implement\b/,
    allow: negativeGuidance,
  },
  {
    name: 'operations map',
    pattern: /(^|[^-])\boperations\b/,
    allow: negativeGuidance,
  },
  {
    name: '@Middleware primary access',
    pattern: /@Middleware\b/,
    allow: negativeGuidance,
  },
  {
    name: 'old contract bundle wording',
    pattern: /\bcontract methods\b|\bcontracts \+ schema\b|\bcontract file\b/i,
    allow: negativeGuidance,
  },
]

const violations = []

for (const file of unique(files)) {
  if (file === 'MIGRATION.md' || file.startsWith('packages/nova/src/')) {
    continue
  }

  const text = readFileSync(new URL(file, root), 'utf8')
  const lines = text.split('\n')

  lines.forEach((line, index) => {
    for (const check of checks) {
      if (check.pattern.test(line) && !check.allow(line)) {
        violations.push({
          file,
          line: index + 1,
          check: check.name,
          text: line.trim(),
        })
      }
    }
  })
}

if (violations.length > 0) {
  console.error('Nova agent-pattern audit failed.\n')
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line} [${violation.check}] ${violation.text}`)
  }
  console.error('\nUse Nova 2.0 public vocabulary: routes, access, handlers, and @Handle.')
  process.exit(1)
}

console.log('Nova agent-pattern audit passed.')

function walk(dir, extensions) {
  const base = new URL(dir, root)
  if (!existsSync(base)) {
    return []
  }

  const results = []
  visit(dir)
  return results.sort()

  function visit(relativeDir) {
    const absoluteDir = new URL(relativeDir, root)
    for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
      const relativePath = join(relativeDir, entry.name)
      if (entry.isSymbolicLink()) {
        continue
      }
      if (entry.isDirectory()) {
        visit(relativePath)
      } else if (entry.isFile() && extensions.some((extension) => relativePath.endsWith(extension))) {
        results.push(relativePath)
      }
    }
  }
}

function unique(values) {
  return [...new Set(values)]
}

function negativeGuidance(line) {
  return /\b[Dd]o not\b|\b[Dd]on't\b|\bnot\b|\bdoes not\b|\bshould not\b|\bnever\b/.test(line)
}
