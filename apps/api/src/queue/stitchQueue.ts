import { Queue } from 'bullmq';

export const stitchQueue = new Queue('stitchQueue', {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6380', 10), // Use BullMQ Redis on 6380
  },
});
