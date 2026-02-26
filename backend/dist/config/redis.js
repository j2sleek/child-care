import { createClient } from 'redis';
import { env } from "./env.js";
const redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
        reconnectStrategy(retries) {
            if (retries > 10)
                return new Error('Redis max retries reached');
            return Math.min(retries * 200, 5000);
        }
    }
});
redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.on('reconnecting', () => console.log('Redis reconnecting...'));
let connected = false;
redisClient.connect()
    .then(() => { connected = true; })
    .catch((err) => {
    console.error('Redis connection failed:', err);
});
export function isRedisReady() {
    return connected && redisClient.isReady;
}
export default redisClient;
