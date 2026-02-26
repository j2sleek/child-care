import dotenv from 'dotenv';
dotenv.config();
function required(name, def) {
    const value = process.env[name] ?? def;
    if (!value)
        throw new Error(`Missing required env var: ${name}`);
    return value;
}
export const env = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    PORT: Number(process.env.PORT ?? 4000),
    MONGODB_URI: required('MONGODB_URI'),
    JWT_SECRET: required('JWT_SECRET'),
    JWT_EXPIRES_IN: required('JWT_EXPIRES_IN', '7d'),
    JWT_REFRESH_EXPIRES_IN: required('JWT_REFRESH_EXPIRES_IN', '30d'),
    JWT_ISSUER: process.env.JWT_ISSUER ?? 'child-care-api',
    JWT_AUDIENCE: process.env.JWT_AUDIENCE ?? 'child-care-client',
    REDIS_URL: required('REDIS_URL'),
    CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS ?? 86400),
    NORMS_VERSION: required('NORMS_VERSION', '2025.01'),
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ?? '',
    AI_PROVIDER: process.env.AI_PROVIDER ?? 'mistral',
    AI_CACHE_TTL_SECONDS: Number(process.env.AI_CACHE_TTL_SECONDS ?? 3600),
    CORS_ORIGINS: process.env.CORS_ORIGINS ?? '*',
    RATE_LIMIT_POINTS: Number(process.env.RATE_LIMIT_POINTS ?? 100),
    RATE_LIMIT_DURATION: Number(process.env.RATE_LIMIT_DURATION ?? 60),
    AUTH_RATE_LIMIT_POINTS: Number(process.env.AUTH_RATE_LIMIT_POINTS ?? 10),
    AUTH_RATE_LIMIT_DURATION: Number(process.env.AUTH_RATE_LIMIT_DURATION ?? 60),
    DIGEST_SCHEDULE_HOUR: Number(process.env.DIGEST_SCHEDULE_HOUR ?? 3),
};
