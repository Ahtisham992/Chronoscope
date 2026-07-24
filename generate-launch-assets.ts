import fs from 'fs';
import path from 'path';

const DOMAINS = ['apple.com', 'microsoft.com', 'ebay.com'];
const API_BASE = 'http://localhost:4000/api';
const OUT_DIR = path.join(process.cwd(), 'launch-assets');
const VIDEOS_DIR = path.join(process.cwd(), 'apps', 'api', 'videos');

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function prepareLaunchAssets() {
  console.log('🚀 Preparing Launch Assets for:', DOMAINS);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // 1. Submit domains
  console.log('\n[1] Submitting hero jobs...');
  await Promise.all(
    DOMAINS.map(async (domain) => {
      try {
        await fetch(`${API_BASE}/domain/${domain}/render`, { method: 'POST' });
        console.log(`✅ Submitted ${domain}`);
      } catch (err: any) {
        console.error(`❌ Failed to submit ${domain}`);
      }
    })
  );

  // 2. Poll statuses
  console.log('\n[2] Waiting for renders to complete...');
  const pending = new Set(DOMAINS);
  
  while (pending.size > 0) {
    for (const domain of Array.from(pending)) {
      try {
        const res = await fetch(`${API_BASE}/domain/${domain}/status`);
        const data = await res.json() as any;
        const status = data.status;
        
        if (status === 'done') {
          console.log(`\n🎉 ${domain} finished processing!`);
          
          // Copy to launch-assets
          const srcFile = path.join(VIDEOS_DIR, `${domain}.mp4`);
          const destFile = path.join(OUT_DIR, `${domain}.mp4`);
          
          if (fs.existsSync(srcFile)) {
            fs.copyFileSync(srcFile, destFile);
            console.log(`📦 Copied ${domain}.mp4 to launch-assets/`);
          } else {
            console.error(`⚠️ Video file not found: ${srcFile}`);
          }
          
          pending.delete(domain);
        } else if (status === 'failed') {
          console.error(`\n❌ ${domain} failed processing!`);
          pending.delete(domain);
        } else {
          process.stdout.write(`.`); // Still pending/rendering/stitching
        }
      } catch (err: any) {
         // Silently ignore poll fails
      }
    }
    
    if (pending.size > 0) {
      await delay(5000); // Poll every 5s
    }
  }

  console.log(`\n✅ All launch assets prepared in /launch-assets folder!`);
}

prepareLaunchAssets().catch(console.error);
