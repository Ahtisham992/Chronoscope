import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const domain = process.argv[2];
  const timestamp = process.argv[3];

  if (!domain || !timestamp) {
    console.error('Usage: npx ts-node src/render/screenshot-poc.ts <domain> <timestamp>');
    process.exit(1);
  }

  // The id_ suffix is critical: it tells the Wayback Machine to serve the raw, original bytes
  // without injecting their HTML top banner or rewriting relative links, which is necessary for a clean screenshot.
  const url = `http://web.archive.org/web/${timestamp}id_/${domain.startsWith('http') ? domain : `http://${domain}`}`;
  
  console.log(`[PoC] Capturing ${domain} at ${timestamp}...`);
  console.log(`[PoC] URL: ${url}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    // Wait for the network to be mostly idle to ensure CSS/images load, 
    // but put a hard timeout so we don't hang on broken 20-year-old image links.
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (error: any) {
    console.warn(`[PoC] Page load warning (expected for old archives): ${error.message}`);
  }

  // Allow a tiny bit of extra time for JS execution to settle
  await page.waitForTimeout(2000);

  const outDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  const outPath = path.join(outDir, `${domain.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.png`);
  
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`[PoC] Saved screenshot to ${outPath}`);

  await browser.close();
}

main().catch(console.error);
