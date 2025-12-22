import { createServer } from 'http'
import app from './app.ts'
import { env }from './config/env.ts'
import './config/db.ts'

const server = createServer(app)

server.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`)
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})