import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { DomainService } from './cdx/service';
import { renderQueue } from './queue/renderQueue';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
const port = process.env.PORT || 4000;

app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'chronoscope-api' });
});

app.get('/api/domain/:domain/snapshots', async (req: Request, res: Response) => {
  const domain = req.params.domain;
  
  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  try {
    const snapshots = await DomainService.getSnapshots(domain);
    res.json({
      domain,
      count: snapshots.length,
      snapshots: snapshots.map(s => ({
        timestamp: s.timestamp,
        originalUrl: s.originalUrl,
        status: s.status
      }))
    });
  } catch (error: any) {
    console.error(`[API] Error fetching snapshots for ${domain}:`, error);
    res.status(500).json({ error: 'Failed to fetch snapshots', message: error.message });
  }
});

app.post('/api/domain/:domain/render', async (req: Request, res: Response) => {
  const domain = req.params.domain;
  
  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  try {
    const job = await renderQueue.add('render-domain', { domain });
    
    // Update domain status to pending/enqueued
    await prisma.domain.upsert({
      where: { hostname: domain },
      update: { status: 'pending' },
      create: { hostname: domain, status: 'pending' }
    });

    res.json({ message: 'Render job enqueued', jobId: job.id, domain });
  } catch (error: any) {
    console.error(`[API] Error enqueuing render job for ${domain}:`, error);
    res.status(500).json({ error: 'Failed to enqueue job', message: error.message });
  }
});

app.get('/api/domain/:domain/status', async (req: Request, res: Response) => {
  const domainHostname = req.params.domain;

  try {
    const domain = await prisma.domain.findUnique({
      where: { hostname: domainHostname }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const totalSnapshots = await prisma.snapshot.count({
      where: { domainId: domain.id }
    });

    const renderedFrames = await prisma.frame.count({
      where: { domain: domainHostname }
    });

    res.json({
      domain: domainHostname,
      status: domain.status,
      totalSnapshots,
      renderedFrames
    });
  } catch (error: any) {
    console.error(`[API] Error fetching status for ${domainHostname}:`, error);
    res.status(500).json({ error: 'Failed to fetch status', message: error.message });
  }
});

app.listen(port, () => {
  console.log(`[server]: API running at http://localhost:${port}`);
});
