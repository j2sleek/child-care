import { createServer } from 'http'
import app from './app.js'
import { env }from './config/env.js'
import './config/db.js'

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