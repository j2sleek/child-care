import { type Request, type Response } from 'express';
import { z } from 'zod';
import * as AuthService from './auth.service.ts';

const registerSchema = z.object({ 
    email: z.email(), 
    password: z.string().min(8), 
    name: z.string().optional() 
});
const loginSchema = z.object({ 
    email: z.email(), 
    password: z.string().min(8) 
});

export async function register(req: Request, res: Response) {
  const body = registerSchema.parse(req.body);
  const user = await AuthService.register(body.email, body.password, body.name);
  res.status(201).json({ 
    id: user._id, 
    email: user.email, 
    name: user.name 
  });
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const { token, user } = await AuthService.login(body.email, body.password);
  res.json({ token, user: { 
    id: user._id, 
    email: user.email, 
    name: user.name 
  } });
}
