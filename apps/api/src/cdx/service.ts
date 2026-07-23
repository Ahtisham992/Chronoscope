import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { CdxClient } from './client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export class DomainService {
  /**
   * Fetches snapshots for a domain, preferring the database cache.
   * If not cached or older than 24 hours, it fetches from CDX and saves to DB.
   */
  static async getSnapshots(hostname: string) {
    let domain = await prisma.domain.findUnique({
      where: { hostname }
    });

    const now = new Date();
    const CACHE_TTL_HOURS = 24;

    // Check if we need to fetch from CDX
    let needsFetch = false;
    if (!domain) {
      domain = await prisma.domain.create({
        data: { hostname }
      });
      needsFetch = true;
    } else if (
      !domain.lastCdxFetch || 
      (now.getTime() - domain.lastCdxFetch.getTime()) > (CACHE_TTL_HOURS * 60 * 60 * 1000)
    ) {
      needsFetch = true;
    }

    if (needsFetch) {
      console.log(`[DomainService] Cache miss or expired for ${hostname}. Fetching from CDX...`);
      const cdxSnapshots = await CdxClient.getSnapshots(hostname);

      if (cdxSnapshots.length > 0) {
        // Upsert all snapshots
        // Note: For tens of thousands of snapshots, createMany is better, but since
        // we might have duplicates and Prisma doesn't have an easy onConflict DoNothing for createMany in all DBs,
        // we use createMany with skipDuplicates (supported in Postgres).
        await prisma.snapshot.createMany({
          data: cdxSnapshots.map(s => ({
            domainId: domain!.id,
            timestamp: s.timestamp,
            originalUrl: s.original,
            digest: s.digest
          })),
          skipDuplicates: true
        });
      }

      // Update last fetch time
      await prisma.domain.update({
        where: { id: domain.id },
        data: { lastCdxFetch: now }
      });
    } else {
      console.log(`[DomainService] Cache hit for ${hostname}. Loading from database...`);
    }

    // Retrieve the snapshots from DB, ordered by timestamp
    const snapshots = await prisma.snapshot.findMany({
      where: { domainId: domain.id },
      orderBy: { timestamp: 'asc' }
    });

    return snapshots;
  }
}
