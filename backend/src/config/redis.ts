import { createClient } from 'redis';
import { env } from './env.ts';
import logger from './logger.ts';

const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy(retries) {
      if (retries > 10) return new Error('Redis max retries reached');
      return Math.min(retries * 200, 5000);
    }
  }
});

redisClient.on('error', (err) => logger.error({ err }, 'Redis error'));
redisClient.on('reconnecting', () => logger.warn('Redis reconnecting'));

let connected = false;

redisClient.connect()
  .then(() => { connected = true; })
  .catch((err) => {
    logger.error({ err }, 'Redis connection failed');
  });

export function isRedisReady(): boolean {
  return connected && redisClient.isReady;
}

export default redisClient;
