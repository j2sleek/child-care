import { type Request, type Response } from "express"
import UserModel from '../modules/users/user.model.ts'

export async function requireAdmin(req: Request, res: Response, next: (error?: Error | 'route' | 'router') => void) {
  if (!req.user) return res.status(401).json({
    code: 'UNAUTHORIZED',
    message: 'Login required'
  })
  const user = await UserModel.findById(req.user.id).lean()
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Admin only'
    })
  }
  next()
}