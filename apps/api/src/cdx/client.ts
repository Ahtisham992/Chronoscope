import { cdxQueue } from './queue';

export interface CdxSnapshot {
  timestamp: string;
  original: string;
  mimetype: string;
  statuscode: string;
  digest: string;
}

export class CdxClient {
  private static CDX_API_URL = 'https://web.archive.org/cdx/search/cdx';

  /**
   * Fetches the full list of available HTML snapshots (HTTP 200) for a given domain.
   */
  static async getSnapshots(domain: string): Promise<CdxSnapshot[]> {
    return cdxQueue.enqueue(async () => {
      try {
        return await this.fetchWithParams(domain, { collapse: 'timestamp:6' });
      } catch (error: any) {
        if (error.status >= 500 || error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('fetch failed')) {
          console.warn(`[CdxClient] Standard query failed for ${domain} (${error.message}). Falling back to limit=-1000...`);
          // Try again without collapse, fetching the most recent 1000 snapshots.
          // This prevents timeouts on massive domains like google.com
          return await this.fetchWithParams(domain, { limit: '-1000' });
        }
        throw error;
      }
    });
  }

  private static async fetchWithParams(domain: string, params: Record<string, string>): Promise<CdxSnapshot[]> {
    const url = new URL(this.CDX_API_URL);
    url.searchParams.set('url', domain);
    url.searchParams.set('output', 'json');
    url.searchParams.set('fl', 'timestamp,original,mimetype,statuscode,digest');
    url.searchParams.set('filter', 'statuscode:200');
    url.searchParams.append('filter', 'mimetype:text/html');
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    console.log(`[CdxClient] Fetching CDX for ${domain} with ${new URLSearchParams(params).toString()}...`);
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Chronoscope / Watch the internet grow up',
      }
    });

    if (!response.ok) {
      const error: any = new Error(`CDX request failed: ${response.status} ${response.statusText}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json() as string[][];
    
    if (!data || data.length === 0) {
      return [];
    }

    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
      const snapshot: any = {};
      headers.forEach((header, index) => {
        snapshot[header] = row[index];
      });
      return snapshot as CdxSnapshot;
    });
  }
}
