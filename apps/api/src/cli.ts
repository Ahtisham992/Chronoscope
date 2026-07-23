import { DomainService } from './cdx/service';

async function main() {
  const domain = process.argv[2];

  if (!domain) {
    console.error('Usage: npx ts-node src/cli.ts <domain>');
    process.exit(1);
  }

  console.log(`Querying service for domain: ${domain}...`);
  try {
    const snapshots = await DomainService.getSnapshots(domain);
    console.log(`Found ${snapshots.length} snapshots in DB.`);
    
    if (snapshots.length > 0) {
      console.log(`First snapshot: ${snapshots[0].timestamp}`);
      console.log(`Last snapshot: ${snapshots[snapshots.length - 1].timestamp}`);
    }
  } catch (error: any) {
    console.error('Failed to query service:', error.message);
  }
}

main();
