import { createServer } from 'http'
import app from './app.js'
import { env }from './config/env.js'
import './config/db.js'

const server = createServer(app)

server.listen(env.PORT, () => {
  
})