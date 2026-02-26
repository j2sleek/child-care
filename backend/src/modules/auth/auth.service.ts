import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.ts'
import redisClient from '../../config/redis.ts'
import UserModel, { type UserDoc } from '../users/user.model.ts'
import { logAudit } from '../../utils/audit.ts'

// Refresh token TTL matches JWT_REFRESH_EXPIRES_IN (seconds)
function refreshTtlSeconds(): number {
  const val = env.JWT_REFRESH_EXPIRES_IN; // e.g. "30d"
  const match = /^(\d+)([smhd])$/.exec(val);
  if (!match) return 30 * 24 * 3600;
  const n = Number(match[1]);
  switch (match[2]) {
    case 's': return n;
    case 'm': return n * 60;
    case 'h': return n * 3600;
    case 'd': return n * 86400;
  }
  return 30 * 24 * 3600;
}

function signAccessToken(user: UserDoc): string {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as any,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    }
  );
}

// Refresh tokens are opaque random IDs stored in Redis, not JWTs.
// This enables one-time-use rotation and immediate revocation.
async function issueRefreshToken(userId: string): Promise<string> {
  const token = randomUUID();
  const key = `rt:${userId}:${token}`;
  await redisClient.set(key, '1', { EX: refreshTtlSeconds() });
  return token;
}

async function revokeRefreshToken(userId: string, token: string): Promise<void> {
  await redisClient.del(`rt:${userId}:${token}`);
}

async function verifyRefreshToken(userId: string, token: string): Promise<boolean> {
  const val = await redisClient.get(`rt:${userId}:${token}`);
  return val === '1';
}

export async function register(email: string, password: string, name?: string): Promise<UserDoc> {
  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 400, code: 'EMAIL_EXISTS' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  return UserModel.create({ email, passwordHash, name });
}

export async function login(email: string, password: string): Promise<{ token: string; refreshToken: string; user: UserDoc }> {
  const user = await UserModel.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401, code: 'INVALID_CREDENTIALS' });
  }
  const token = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user._id.toString());
  return { token, refreshToken, user };
}

export async function refreshAccessToken(incomingToken: string, userId: string): Promise<{ token: string; refreshToken: string }> {
  const valid = await verifyRefreshToken(userId, incomingToken);
  if (!valid) {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401, code: 'INVALID_REFRESH_TOKEN' });
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 401, code: 'USER_NOT_FOUND' });
  }

  // Atomic rotation: revoke old, issue new
  await revokeRefreshToken(userId, incomingToken);
  const newRefreshToken = await issueRefreshToken(userId);

  return { token: signAccessToken(user), refreshToken: newRefreshToken };
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  // Scan and delete all rt:{userId}:* keys on logout
  let cursor = 0;
  do {
    const reply = await redisClient.scan(cursor, { MATCH: `rt:${userId}:*`, COUNT: 100 });
    cursor = reply.cursor;
    if (reply.keys.length > 0) {
      await redisClient.del(reply.keys);
    }
  } while (cursor !== 0);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await UserModel.findById(userId).select('+passwordHash');
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400, code: 'INVALID_PASSWORD' });
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  // Invalidate all refresh tokens so other sessions are logged out
  await revokeAllRefreshTokens(userId);
  logAudit({ userId, action: 'auth.password_changed' });
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await UserModel.findOne({ email });
  if (!user) return; // Silent no-op to prevent email enumeration

  // Generate a short-lived reset token (15 min), stored in Redis for one-time use
  const resetToken = randomUUID();
  await redisClient.set(`pwr:${user._id}:${resetToken}`, '1', { EX: 15 * 60 });
  // TODO: deliver resetToken via email (e.g. sendResetEmail(email, resetToken))
}

export async function resetPassword(userId: string, resetToken: string, newPassword: string): Promise<void> {
  const key = `pwr:${userId}:${resetToken}`;
  const valid = await redisClient.get(key);
  if (!valid) {
    throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400, code: 'INVALID_RESET_TOKEN' });
  }
  await redisClient.del(key); // One-time use: consume immediately

  const user = await UserModel.findById(userId).select('+passwordHash');
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  await revokeAllRefreshTokens(userId);
}
