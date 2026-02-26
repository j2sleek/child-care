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
  NORMS_AI_CACHE_TTL_SECONDS: Number(process.env.NORMS_AI_CACHE_TTL_SECONDS ?? 7200),
  // S3 / avatars
  AWS_REGION: process.env.AWS_REGION ?? 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME ?? '',
  S3_AVATAR_PREFIX: process.env.S3_AVATAR_PREFIX ?? 'avatars/',
  S3_PRESIGN_EXPIRES_SECONDS: Number(process.env.S3_PRESIGN_EXPIRES_SECONDS ?? 300),
  // AI model / providers
  AI_MODEL: process.env.AI_MODEL ?? '',           // overrides provider default model
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-4o',
  AI_CHAT_HISTORY_LIMIT: Number(process.env.AI_CHAT_HISTORY_LIMIT ?? 20),
  AI_CHAT_DAILY_LIMIT: Number(process.env.AI_CHAT_DAILY_LIMIT ?? 50),
  BILLING_WEBHOOK_SECRET: process.env.BILLING_WEBHOOK_SECRET ?? '',
  // Email (SMTP)
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  SMTP_FROM: process.env.SMTP_FROM ?? 'no-reply@childcare.app',
  // Push notifications (FCM)
  FCM_SERVER_KEY: process.env.FCM_SERVER_KEY ?? '',
}
