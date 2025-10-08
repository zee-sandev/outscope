import { mkdir, writeFile, readFile } from 'fs/promises'
import { join, dirname } from 'path'

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (char) => char.toUpperCase())
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Generate controller file content
 */
export function generateController(name: string, featureName: string): string {
  const className = `${toPascalCase(name)}Controller`
  const contractName = toCamelCase(name)

  return `import { Controller, Implement, Implementer } from '@outscope/orpc-hono'
import { ${contractName} } from '@contracts/${toKebabCase(featureName)}'
import { pub } from '@libs/orpc/orpc'
import { ${contractName}Service } from './${toKebabCase(name)}.service'
import type { ORPCContext } from '@libs/orpc/context'

@Controller()
@Implementer(pub)
export class ${className} {
  // TODO: Implement contract methods
  // Example:
  // @Implement(${contractName}.list)
  // async list(input: any, context: ORPCContext): Promise<any> {
  //   return ${contractName}Service.list(input)
  // }
}
`
}

/**
 * Generate service file content
 */
export function generateService(name: string): string {
  const serviceName = `${toCamelCase(name)}Service`
  const repositoryName = `${toCamelCase(name)}Repository`

  return `import { ${repositoryName} } from './${toKebabCase(name)}.repository'
import { logger } from '@libs/logger'

export const ${serviceName} = {
  // TODO: Implement service methods
  // Example:
  // list: async (page = 1, pageSize = 10) => {
  //   logger.debug({ page, pageSize }, '${toPascalCase(name)} service: list')
  //   return ${repositoryName}.list((page - 1) * pageSize, pageSize)
  // },
} as const
`
}

/**
 * Generate repository file content
 */
export function generateRepository(name: string): string {
  const repositoryName = `${toCamelCase(name)}Repository`
  const modelName = toPascalCase(name)

  return `import { prisma } from '@libs/prisma'

export const ${repositoryName} = {
  // TODO: Implement repository methods
  // Example:
  // list: async (skip: number, take: number) => {
  //   return prisma.${toCamelCase(name)}.findMany({ skip, take })
  // },
  //
  // findById: async (id: string) => {
  //   return prisma.${toCamelCase(name)}.findUnique({ where: { id } })
  // },
  //
  // create: async (data: any) => {
  //   return prisma.${toCamelCase(name)}.create({ data })
  // },
  //
  // update: async (id: string, data: any) => {
  //   return prisma.${toCamelCase(name)}.update({ where: { id }, data })
  // },
  //
  // delete: async (id: string) => {
  //   return prisma.${toCamelCase(name)}.delete({ where: { id } })
  // },
} as const
`
}

/**
 * Generate contract file content
 */
export function generateContract(name: string): string {
  const contractName = toCamelCase(name)
  const pascalName = toPascalCase(name)

  return `import { oc } from '@orpc/contract'
import { z } from 'zod'

// TODO: Define your input/output schemas
const List${pascalName}Input = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
})

const ${pascalName}Output = z.object({
  id: z.string(),
  // TODO: Add your fields
})

export const list = oc
  .route({
    method: 'POST',
    path: '/${toKebabCase(name)}s',
    summary: 'List all ${toKebabCase(name)}s',
    tags: ['${pascalName}s'],
  })
  .input(List${pascalName}Input)
  .output(z.object({
    items: z.array(${pascalName}Output),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
  }))

export const ${contractName} = {
  list,
  // TODO: Add more contract methods (get, create, update, delete)
}
`
}

/**
 * Generate schema file content
 */
export function generateSchema(name: string): string {
  const pascalName = toPascalCase(name)

  return `import { z } from 'zod'

// TODO: Define your schemas
export const ${pascalName}Schema = z.object({
  id: z.string(),
  // TODO: Add your fields
})

export type ${pascalName} = z.infer<typeof ${pascalName}Schema>
`
}

/**
 * Generate index file content for a feature
 */
export function generateFeatureIndex(name: string): string {
  const className = `${toPascalCase(name)}Controller`
  return `export { ${className} } from './${toKebabCase(name)}.controller'
`
}

/**
 * Write generated file
 */
export async function writeGeneratedFile(
  filePath: string,
  content: string
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, content, 'utf-8')
}

/**
 * Check if file exists by trying to read it
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath)
    return true
  } catch {
    return false
  }
}
