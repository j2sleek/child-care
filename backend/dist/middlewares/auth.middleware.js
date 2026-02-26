import jwt from 'jsonwebtoken';
import { env } from "../config/env.js";
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({
            code: 'UNAUTHORIZED',
            message: 'Missing bearer token'
        });
    }
    const token = header.replace('Bearer ', '');
    try {
        const payload = jwt.verify(token, env.JWT_SECRET, {
            issuer: env.JWT_ISSUER,
            audience: env.JWT_AUDIENCE
        });
        req.user = {
            id: payload.sub,
            email: payload.email
        };
        return next();
    }
    catch {
        return res.status(401).json({
            code: 'UNAUTHORIZED',
            message: 'Invalid token'
        });
    }
}
