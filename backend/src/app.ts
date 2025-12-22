import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import pinoHttp from 'pino-http'

import { requestId } from './middlewares/requsetId.middleware.js'
import { errorMiddleware } from './middlewares/error.middleware.js'
import { rateLimit } from './middlewares/rate.middleware.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(compression())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(pinoHttp())
app.use(morgan('tiny'))
app.use(requestId)


app.use(errorMiddleware)

export default app