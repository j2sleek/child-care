import { createServer } from 'http';
import app from "./app.js";
import { env } from "./config/env.js";
import { dbReady } from "./config/db.js";
import redisClient from "./config/redis.js";
import mongoose from 'mongoose';
import { scheduleDigests } from "./modules/ai/ai.scheduler.js";
const server = createServer(app);
// Wait for DB before accepting connections
dbReady.then(() => {
    server.listen(env.PORT, () => {
        console.log(`Server listening on port ${env.PORT}`);
        scheduleDigests();
    });
});
// Graceful shutdown
function gracefulShutdown(signal) {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        console.log('HTTP server closed');
        try {
            await mongoose.disconnect();
            console.log('MongoDB disconnected');
        }
        catch (err) {
            console.error('MongoDB disconnect error:', err);
        }
        try {
            await redisClient.quit();
            console.log('Redis disconnected');
        }
        catch (err) {
            console.error('Redis disconnect error:', err);
        }
        process.exit(0);
    });
    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10_000);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
