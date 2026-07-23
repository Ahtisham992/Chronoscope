import 'dotenv/config';
import { Worker, Job, ConnectionOptions } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6380', 10),
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log('[StitchWorker] Starting background stitch worker...');

interface StitchJobData {
  domain: string;
}

const stitchWorker = new Worker<StitchJobData>(
  'stitchQueue',
  async (job: Job<StitchJobData>) => {
    const { domain } = job.data;
    console.log(`[StitchWorker] Picked up job ${job.id} to stitch video for: ${domain}`);

    const frames = await prisma.frame.findMany({
      where: { domain },
      orderBy: { timestamp: 'asc' }
    });

    if (frames.length === 0) {
      throw new Error(`No frames found in DB for ${domain}`);
    }

    const videoDir = path.join(process.cwd(), 'videos');
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir);
    }

    // Dynamic pacing: ~20 seconds
    let frameDuration = 20 / frames.length;
    frameDuration = Math.max(0.1, Math.min(2.0, frameDuration));

    const concatPath = path.join(videoDir, `${domain}_concat.txt`);
    let concatData = '';
    for (const frame of frames) {
      const safePath = frame.filePath.replace(/\\/g, '/');
      concatData += `file '${safePath}'\n`;
      concatData += `duration ${frameDuration.toFixed(2)}\n`; 
    }
    if (frames.length > 0) {
      const lastFrame = frames[frames.length - 1];
      concatData += `file '${lastFrame.filePath.replace(/\\/g, '/')}'\n`;
    }
    fs.writeFileSync(concatPath, concatData);

    const outputPath = path.join(videoDir, `${domain}.mp4`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(concatPath)
        .inputOptions(['-f concat', '-safe 0'])
        .videoCodec('h264_nvenc')
        .outputOptions([
          '-pix_fmt yuv420p',
          '-preset p4', // Optimized fast preset for NVENC
          '-r 30'
        ])
        .on('start', (cmd) => console.log(`[StitchWorker] Spawned FFmpeg: ${cmd}`))
        .on('progress', (p) => console.log(`[StitchWorker] Processing: ${p.percent}% done`))
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });

    console.log(`[StitchWorker] Video successfully created at ${outputPath}`);

    // Update Domain status to done
    await prisma.domain.update({
      where: { hostname: domain },
      data: { status: 'done' }
    });
    
    console.log(`[StitchWorker] Finished job ${job.id} for domain: ${domain}. Video ready!`);
  },
  { connection }
);

stitchWorker.on('failed', async (job, err) => {
  console.error(`[StitchWorker] Job ${job?.id} failed:`, err);
  if (job?.data?.domain) {
    await prisma.domain.update({
      where: { hostname: job.data.domain },
      data: { status: 'failed' }
    }).catch(console.error);
  }
});

stitchWorker.on('error', err => {
  console.error('[StitchWorker] Unexpected error:', err);
});
