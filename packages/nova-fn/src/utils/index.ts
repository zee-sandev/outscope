/**
 * Utility functions for @outscope/nova
 *
 * Common helpers for authentication, database integration, and other
 * cross-cutting concerns.
 */

// Authentication utilities
export {
  extractToken,
  extractBearerToken,
  extractCookieToken,
  type TokenExtractionResult,
  type ExtractTokenOptions,
  type TokenExtractionContext,
} from './auth'

// Prisma integration utilities
export {
  attachPrismaLogging,
  createSqlFormatter,
  type PrismaClientLike,
  type PrismaLoggingOptions,
} from './prisma'
