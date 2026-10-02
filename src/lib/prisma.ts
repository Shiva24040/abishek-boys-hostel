import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith('file:')) {
    return envUrl;
  }
  const prismaDir = path.resolve(process.cwd(), 'prisma');
  if (!fs.existsSync(prismaDir)) {
    try {
      fs.mkdirSync(prismaDir, { recursive: true });
    } catch {}
  }
  const absPath = path.resolve(prismaDir, 'dev.db');
  return `file:${absPath.replace(/\\/g, '/')}`;
}

const resolvedUrl = getDatabaseUrl();
process.env.DATABASE_URL = resolvedUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
