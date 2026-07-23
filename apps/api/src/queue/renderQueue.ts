import { Queue, ConnectionOptions } from 'bullmq';

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6380', 10),
};

export interface RenderJobData {
  domain: string;
}

export const renderQueue = new Queue<RenderJobData>('render-queue', { connection });
