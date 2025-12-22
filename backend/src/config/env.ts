import dotenv from 'dotenv'
dotenv.config()

function required(name: string, def?: string) {
  const value = process.env[name] ?? def
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  MONGODB_URI: required('MONGODB_URI'),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: required('JWT_EXPIRES_IN', '7d'),
  REDIS_URL: required('REDIS_URL'),
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS ?? 86400),
  NORMS_VERSION: required('NORMS_VERSION', '2025.01')
}