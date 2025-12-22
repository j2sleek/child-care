import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import UserModel, { UserDoc } from '../users/user.model.js'

export async function register(email: string, password: string, name?: string): Promise<UserDoc> {
  const existing = await UserModel.findOne({ email });
  if (existing) {
    const err: any = new Error('Email already registered');
    err.statusCode = 400;
    err.code = 'EMAIL_EXISTS';
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await UserModel.create({
    email,
    passwordHash,
    name
  });
  return user;
}

export async function login(email: string, password: string): Promise<{ token: string, user: UserDoc }> {
  const user = await UserModel.findOne({ email });
  if (!user) {
    const err: any = new Error('Invalid credientials');
    err.statusCode = 401;
    err.code = 'INVALID_CREDIENTIALS';
    throw err;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err: any = new Error('Invalid credientials');
    err.statusCode = 401;
    err.code = 'INVALID_CREDIENTIALS';
    throw err;
  }
  const token = jwt.sign(
    { sub: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN}
  );
  
  return { token, user}
}