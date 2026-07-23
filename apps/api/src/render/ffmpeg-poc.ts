import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Setup ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function stitchFrames(domain: string) {
  console.log(`[FFmpeg PoC] Starting video stitch for ${domain}...`);

  // 1. Fetch frames from DB, ordered by timestamp ascending
  const frames = await prisma.frame.findMany({
    where: { domain },
    orderBy: { timestamp: 'asc' }
  });

  if (frames.length === 0) {
    console.error(`[FFmpeg PoC] No frames found for ${domain}.`);
    process.exit(1);
  }

  console.log(`[FFmpeg PoC] Found ${frames.length} frames.`);

  // 2. Prepare directories
  const videoDir = path.join(process.cwd(), 'videos');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir);
  }

  // Dynamic Pacing: Target ~20 seconds total
  // Ensure we don't go faster than 0.1s per frame or slower than 2s per frame
  let frameDuration = 20 / frames.length;
  frameDuration = Math.max(0.1, Math.min(2.0, frameDuration));
  console.log(`[FFmpeg PoC] Pacing calculated at ${frameDuration.toFixed(2)}s per frame.`);

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
  console.log(`[FFmpeg PoC] Wrote concat file to ${concatPath}`);

  // 4. Run FFmpeg
  const outputPath = path.join(videoDir, `${domain}.mp4`);
  
  ffmpeg()
    .input(concatPath)
    .inputOptions(['-f concat', '-safe 0'])
    .videoCodec('libx264')
    .outputOptions([
      '-pix_fmt yuv420p',
      '-vf minterpolate=fps=30:mi_mode=blend', // Cross-fade blend
      '-r 30'
    ])
    .on('start', (command) => {
      console.log(`[FFmpeg PoC] Spawned Ffmpeg with command: ${command}`);
    })
    .on('progress', (progress) => {
      console.log(`[FFmpeg PoC] Processing: ${progress.percent ? progress.percent.toFixed(2) : 0}% done`);
    })
    .on('end', () => {
      console.log(`[FFmpeg PoC] Finished processing! Video saved to ${outputPath}`);
      process.exit(0);
    })
    .on('error', (err) => {
      console.error(`[FFmpeg PoC] Error: ${err.message}`);
      process.exit(1);
    })
    .save(outputPath);
}

const targetDomain = process.argv[2];
if (!targetDomain) {
  console.error('Please provide a domain, e.g., "npx ts-node src/render/ffmpeg-poc.ts example.com"');
  process.exit(1);
}

stitchFrames(targetDomain);
