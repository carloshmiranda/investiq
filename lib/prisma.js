// lib/prisma.js
// Singleton Prisma client — shared across all serverless functions
// Implemented in item 0.2
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
