/**
 * Simple in-memory rate limiter for CDX requests.
 * Enforces 1 request per second and exponential backoff on 429/503.
 */

type Job<T> = () => Promise<T>;

export class CdxQueue {
  private queue: { job: Job<any>; resolve: (v: any) => void; reject: (e: any) => void }[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly delayMs = 1000; // 1 request per second

  // Backoff state
  private currentBackoffMs = 0;
  private readonly maxBackoffMs = 60000; // 60 seconds

  async enqueue<T>(job: Job<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ job, resolve, reject });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    
    // Apply backoff if needed, otherwise normal rate limit
    const waitTime = this.currentBackoffMs > 0 
      ? this.currentBackoffMs 
      : Math.max(0, this.delayMs - timeSinceLast);

    if (waitTime > 0) {
      await new Promise(r => setTimeout(r, waitTime));
    }

    const { job, resolve, reject } = this.queue.shift()!;
    this.lastRequestTime = Date.now();

    try {
      const result = await job();
      // On success, reset backoff
      this.currentBackoffMs = 0;
      resolve(result);
    } catch (error: any) {
      if (error?.status === 429 || error?.status === 503) {
        // Exponential backoff
        this.currentBackoffMs = this.currentBackoffMs === 0 ? 3000 : Math.min(this.currentBackoffMs * 2, this.maxBackoffMs);
        console.warn(`[CdxQueue] Received ${error.status}. Backing off for ${this.currentBackoffMs}ms...`);
        // Put job back at the front of the queue
        this.queue.unshift({ job, resolve, reject });
      } else {
        reject(error);
      }
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }
}

export const cdxQueue = new CdxQueue();
