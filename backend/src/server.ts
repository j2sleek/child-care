import { createServer } from 'http'
import app from './app.ts'
import { env } from './config/env.ts'
import { dbReady } from './config/db.ts'
import redisClient from './config/redis.ts'
import logger from './config/logger.ts'
import mongoose from 'mongoose'
import { scheduleDigests } from './modules/ai/ai.scheduler.ts'
import { scheduleTrialNotifications } from './modules/notifications/trial.scheduler.ts'
import { scheduleReminders } from './modules/reminders/reminder.scheduler.ts'

const server = createServer(app)

// Wait for DB before accepting connections
dbReady.then(() => {
  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'Server listening')
    scheduleDigests()
    scheduleTrialNotifications()
    scheduleReminders()
  })
})

// Graceful shutdown
function gracefulShutdown(signal: string) {
  logger.info({ signal }, 'Shutting down gracefully')
  server.close(async () => {
    logger.info('HTTP server closed')
    try {
      await mongoose.disconnect()
      logger.info('MongoDB disconnected')
    } catch (err) {
      logger.error({ err }, 'MongoDB disconnect error')
    }
    try {
      await redisClient.quit()
      logger.info('Redis disconnected')
    } catch (err) {
      logger.error({ err }, 'Redis disconnect error')
    }
    process.exit(0)
  })

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10_000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'Unhandled Rejection')
  // Exit so the process manager (PM2, K8s) can restart cleanly
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception')
  // The process is in an undefined state after an uncaught exception — must exit
  process.exit(1)
})
