import 'dotenv/config';
import { Worker, Job, ConnectionOptions } from 'bullmq';
import { RenderJobData } from './queue/renderQueue';
import { stitchQueue } from './queue/stitchQueue';
import { DomainService } from './cdx/service';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6380', 10),
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log('[Worker] Starting background render worker...');

const worker = new Worker<RenderJobData>(
  'render-queue',
  async (job: Job<RenderJobData>) => {
    const { domain } = job.data;
    console.log(`[Worker] Picked up job ${job.id} for domain: ${domain}`);
    
    // Set domain status to rendering
    await prisma.domain.update({
      where: { hostname: domain },
      data: { status: 'rendering' }
    });

    // 1. Fetch snapshots from DB/CDX
    const snapshots = await DomainService.getSnapshots(domain);
    if (snapshots.length === 0) {
      console.log(`[Worker] No snapshots found for ${domain}. Aborting.`);
      return;
    }

    // 2. Sample snapshots (limit to 5 for Phase 8)
    const sampled = snapshots.slice(0, 5);
    console.log(`[Worker] Sampled ${sampled.length} snapshots for rendering.`);

    // 3. Launch Playwright
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const outDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir);
    }

    // 4. Iterate and render
    for (const snapshot of sampled) {
      const { timestamp } = snapshot;
      const url = `http://web.archive.org/web/${timestamp}id_/${domain.startsWith('http') ? domain : `http://${domain}`}`;
      const outPath = path.join(outDir, `${domain.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.png`);
      
      console.log(`[Worker] Rendering ${domain} at ${timestamp}...`);

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (error: any) {
        console.warn(`[Worker] Page load warning for ${timestamp}: ${error.message}`);
      }

      await page.waitForTimeout(2000);
      await page.screenshot({ path: outPath, fullPage: false });

      // Insert Frame record into DB
      await prisma.frame.upsert({
        where: {
          domain_timestamp: {
            domain,
            timestamp
          }
        },
        update: { filePath: outPath },
        create: {
          domain,
          timestamp,
          filePath: outPath
        }
      });
      
      console.log(`[Worker] Saved frame to DB and disk: ${outPath}`);
    }

    await browser.close();

    // Set domain status to stitching and enqueue stitch job
    await prisma.domain.update({
      where: { hostname: domain },
      data: { status: 'stitching' }
    });

    await stitchQueue.add('stitch-video', { domain });
    
    console.log(`[Worker] Finished render job ${job.id} for domain: ${domain}. Enqueued stitch job.`);
  },
  { connection }
);

worker.on('failed', async (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
  if (job?.data?.domain) {
    await prisma.domain.update({
      where: { hostname: job.data.domain },
      data: { status: 'failed' }
    }).catch(console.error);
  }
});

worker.on('error', err => {
  console.error('[Worker] Unexpected error:', err);
});
