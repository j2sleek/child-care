import express, { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware.ts';
import { requirePlan } from '../../middlewares/plan.middleware.ts';
import { requireCapability } from '../ai/providers/index.ts';

const router = Router();

const ALLOWED_AUDIO_MIME = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
] as const;

type AllowedAudioMime = (typeof ALLOWED_AUDIO_MIME)[number];

const CHILD_ROLES = ['father', 'mother', 'nanny', 'doctor'] as const;

const VOICE_SYSTEM_PROMPT = `You are a data extraction assistant for a child care app.
The user has spoken a child profile description. Extract the following fields from the transcript:
- name (string): the child's name
- dateOfBirth (string): the child's date of birth in YYYY-MM-DD format (infer year if only age is given using today's date)
- role (string): the caregiver's relationship — one of: father, mother, nanny, doctor

Return ONLY a JSON object with these keys. If a value cannot be determined, omit that key.
Example: {"name":"Emma","dateOfBirth":"2023-03-15","role":"mother"}`;

/**
 * POST /children/voice
 *
 * Accepts raw audio bytes (Content-Type: audio/*), body size up to 25 MB.
 * Returns pre-filled child form data extracted from the transcribed speech:
 * { name?, dateOfBirth?, role?, transcript }
 *
 * Requires a provider with 'transcription' capability (e.g. OpenAI Whisper).
 */
router.post(
  '/voice',
  requireAuth,
  requirePlan('pro'),
  express.raw({ type: (ALLOWED_AUDIO_MIME as readonly string[]), limit: '25mb' }),
  async (req, res) => {
    const contentType = req.headers['content-type'] ?? '';
    const mime = contentType.split(';')[0].trim() as AllowedAudioMime;

    if (!(ALLOWED_AUDIO_MIME as readonly string[]).includes(mime)) {
      throw Object.assign(
        new Error(`Unsupported audio type. Allowed: ${ALLOWED_AUDIO_MIME.join(', ')}`),
        { statusCode: 400, code: 'INVALID_CONTENT_TYPE' },
      );
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw Object.assign(new Error('No audio data received'), { statusCode: 400, code: 'MISSING_BODY' });
    }

    const provider = requireCapability('transcription');
    const transcript = await provider.transcribeAudio!(req.body, mime);

    // Ask AI to extract structured child data from the transcript
    const raw = await provider.generateCompletion(VOICE_SYSTEM_PROMPT, `Transcript: "${transcript}"`);

    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Best-effort: return transcript only if JSON extraction fails
    }

    // Validate/sanitise extracted fields before returning
    const name = z.string().min(1).max(100).safeParse(parsed.name).success ? parsed.name : undefined;
    const dateOfBirth = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(parsed.dateOfBirth).success
      ? parsed.dateOfBirth
      : undefined;
    const role = z.enum(CHILD_ROLES).safeParse(parsed.role).success ? parsed.role : undefined;

    res.json({ transcript, name, dateOfBirth, role });
  },
);

export default router;
