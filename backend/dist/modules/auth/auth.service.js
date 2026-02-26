import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { env } from "../../config/env.js";
import UserModel from "../users/user.model.js";
function signAccessToken(user) {
    return jwt.sign({ sub: user._id.toString(), email: user.email }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
    });
}
function signRefreshToken(user) {
    return jwt.sign({ sub: user._id.toString(), type: 'refresh' }, env.JWT_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
    });
}
export async function register(email, password, name) {
    const existing = await UserModel.findOne({ email });
    if (existing) {
        const err = new Error('Email already registered');
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
export async function login(email, password) {
    const user = await UserModel.findOne({ email }).select('+passwordHash');
    if (!user) {
        const err = new Error('Invalid credentials');
        err.statusCode = 401;
        err.code = 'INVALID_CREDENTIALS';
        throw err;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        const err = new Error('Invalid credentials');
        err.statusCode = 401;
        err.code = 'INVALID_CREDENTIALS';
        throw err;
    }
    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    return { token, refreshToken, user };
}
export async function refreshAccessToken(refreshToken) {
    let payload;
    try {
        payload = jwt.verify(refreshToken, env.JWT_SECRET, {
            issuer: env.JWT_ISSUER,
            audience: env.JWT_AUDIENCE
        });
    }
    catch {
        const err = new Error('Invalid refresh token');
        err.statusCode = 401;
        err.code = 'INVALID_REFRESH_TOKEN';
        throw err;
    }
    if (payload.type !== 'refresh') {
        const err = new Error('Invalid token type');
        err.statusCode = 401;
        err.code = 'INVALID_TOKEN_TYPE';
        throw err;
    }
    const user = await UserModel.findById(payload.sub);
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 401;
        err.code = 'USER_NOT_FOUND';
        throw err;
    }
    return {
        token: signAccessToken(user),
        refreshToken: signRefreshToken(user)
    };
}
export async function changePassword(userId, currentPassword, newPassword) {
    const user = await UserModel.findById(userId).select('+passwordHash');
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
        const err = new Error('Current password is incorrect');
        err.statusCode = 400;
        err.code = 'INVALID_PASSWORD';
        throw err;
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
}
export async function requestPasswordReset(email) {
    const user = await UserModel.findOne({ email });
    if (!user) {
        // Return success even if email not found to prevent enumeration
        return { resetToken: '' };
    }
    // Generate a short-lived reset token (15 min)
    const resetToken = jwt.sign({ sub: user._id.toString(), type: 'password-reset' }, env.JWT_SECRET, { expiresIn: '15m', issuer: env.JWT_ISSUER });
    // In production, this token would be sent via email
    return { resetToken };
}
export async function resetPassword(resetToken, newPassword) {
    let payload;
    try {
        payload = jwt.verify(resetToken, env.JWT_SECRET, {
            issuer: env.JWT_ISSUER
        });
    }
    catch {
        const err = new Error('Invalid or expired reset token');
        err.statusCode = 400;
        err.code = 'INVALID_RESET_TOKEN';
        throw err;
    }
    if (payload.type !== 'password-reset') {
        const err = new Error('Invalid token type');
        err.statusCode = 400;
        err.code = 'INVALID_TOKEN_TYPE';
        throw err;
    }
    const user = await UserModel.findById(payload.sub);
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
}
export async function promoteToAdmin(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        err.code = 'NOT_FOUND';
        throw err;
    }
    user.role = 'admin';
    await user.save();
}
