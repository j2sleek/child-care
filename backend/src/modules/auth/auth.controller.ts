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
const refreshSchema = z.object({
    refreshToken: z.string().min(1),
    userId: z.string().min(1)
});
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8)
});
const requestResetSchema = z.object({
    email: z.email()
});
const resetPasswordSchema = z.object({
    userId: z.string().min(1),
    resetToken: z.string().min(1),
    newPassword: z.string().min(8)
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
  const { token, refreshToken, user } = await AuthService.login(body.email, body.password);
  res.json({ token, refreshToken, user: {
    id: user._id,
    email: user.email,
    name: user.name
  } });
}

export async function refresh(req: Request, res: Response) {
  const body = refreshSchema.parse(req.body);
  const tokens = await AuthService.refreshAccessToken(body.refreshToken, body.userId);
  res.json(tokens);
}

export async function changePassword(req: Request, res: Response) {
  const body = changePasswordSchema.parse(req.body);
  await AuthService.changePassword(req.user!.id, body.currentPassword, body.newPassword);
  res.json({ message: 'Password changed successfully' });
}

export async function requestPasswordReset(req: Request, res: Response) {
  const body = requestResetSchema.parse(req.body);
  await AuthService.requestPasswordReset(body.email);
  // Always return success to prevent email enumeration. Token is delivered out-of-band (email).
  res.json({ message: 'If the email exists, a reset link has been sent' });
}

export async function resetPassword(req: Request, res: Response) {
  const body = resetPasswordSchema.parse(req.body);
  await AuthService.resetPassword(body.userId, body.resetToken, body.newPassword);
  res.json({ message: 'Password reset successfully' });
}
