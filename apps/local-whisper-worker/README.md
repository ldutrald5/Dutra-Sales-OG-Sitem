# Local Whisper Worker

CPU transcription fallback for Call Intelligence.

- FastAPI + faster-whisper
- private token authentication
- downloads only signed audio from the configured Supabase host
- async in-memory jobs; audio remains canonical in private Supabase Storage
- default model: `base`, CPU `int8`
- no CRM writes

The worker removes per-minute OpenAI transcription dependency, but still consumes Railway CPU/RAM while running.
