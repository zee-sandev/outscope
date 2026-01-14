import { PrismaClient } from '@generated/prisma'
import { createLogger } from '@outscope/orpc-hono'

const logger = createLogger({ level: 'debug', pretty: true })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
  })

// Log all queries
// @ts-expect-error: 'query' is a valid event for PrismaClient, but types may not include it
prisma.$on('query' as any, (e: any) => {
  logger.debug(
    {
      query: (() => {
        // Try to interpolate params into the query for a runnable SQL statement
        let sql = e.query
        let params: any[] = []
        try {
          params = JSON.parse(e.params)
        } catch {
          params = e.params
        }
        // Replace $1, $2, ... with params
        if (Array.isArray(params)) {
          params.forEach((param, i) => {
            let value
            if (param === null) {
              value = 'NULL'
            } else if (typeof param === 'string') {
              // Escape single quotes
              value = `'${param.replace(/'/g, "''")}'`
            } else if (typeof param === 'number' || typeof param === 'boolean') {
              value = param.toString()
            } else if (param instanceof Date) {
              value = `'${param.toISOString()}'`
            } else {
              value = `'${JSON.stringify(param).replace(/'/g, "''")}'`
            }
            // Replace all occurrences of $i+1 (Postgres style)
            sql = sql.replace(new RegExp(`\\$${i + 1}\\b`, 'g'), value)
          })
        }
        // Remove all backslashes
        sql = sql.replace(/\\/g, '')
        return sql
      })(),
      params: e.params,
      duration: `${e.duration}ms`,
    },
    'Prisma Query'
  )
})

// Log errors
// @ts-expect-error: 'error' is a valid event for PrismaClient, but types may not include it
prisma.$on('error' as any, (e: any) => {
  logger.error({ message: e.message }, 'Prisma Error')
})

// Log info
// @ts-expect-error: 'info' is a valid event for PrismaClient, but types may not include it
prisma.$on('info' as any, (e: any) => {
  logger.info({ message: e.message }, 'Prisma Info')
})

// Log warnings
// @ts-expect-error: 'warn' is a valid event for PrismaClient, but types may not include it
prisma.$on('warn' as any, (e: any) => {
  logger.warn({ message: e.message }, 'Prisma Warning')
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
