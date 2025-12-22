import { type Request, type Response } from "express"
import jwt from 'jsonwebtoken'
import { env } from '../config/env.ts'

export interface JwtPayload {
  sub: string,
  email: string
}

export function requireAuth(req: Request, res: Response, next: (error?: Error | 'route' | 'router') => void) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Missing bearer token'
    })
  }
  const token = header.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    (req as any).user = {
      id: payload.sub,
      email: payload.email
    }
    return next()
  } catch {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Invalid token'
    })
  }
}