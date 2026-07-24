const DOMAINS = ['amazon.com', 'netflix.com', 'reddit.com', 'wikipedia.org', 'openai.com'];
const API_BASE = 'http://localhost:4000/api';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runLoadTest() {
  console.log('🚀 Starting Chronoscope Launch Day Load Test');
  console.log(`Targeting ${DOMAINS.length} domains concurrently:`, DOMAINS);

  const startTime = Date.now();

  // 1. Submit all domains simultaneously
  console.log('\n[1] Submitting jobs...');
  await Promise.all(
    DOMAINS.map(async (domain) => {
      try {
        const res = await fetch(`${API_BASE}/domain/${domain}/render`, { method: 'POST' });
        const data = await res.json() as any;
        console.log(`✅ Submitted ${domain}: ${data.message || 'Queued'}`);
      } catch (err: any) {
        console.error(`❌ Failed to submit ${domain}:`, err.message);
      }
    })
  );

  // 2. Poll statuses
  console.log('\n[2] Polling statuses until completion...');
  const pending = new Set(DOMAINS);
  
  while (pending.size > 0) {
    for (const domain of Array.from(pending)) {
      try {
        const res = await fetch(`${API_BASE}/domain/${domain}/status`);
        const data = await res.json() as any;
        const status = data.status;
        
        if (status === 'done') {
          console.log(`\n🎉 ${domain} finished processing!`);
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

  const endTime = Date.now();
  const totalSeconds = ((endTime - startTime) / 1000).toFixed(1);
  console.log(`\n\n✅ Load test complete! Total time: ${totalSeconds} seconds.`);
}

runLoadTest().catch(console.error);
