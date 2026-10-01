import os
import re
import tempfile
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from faster_whisper import WhisperModel

TOKEN = os.environ.get("OG_LOCAL_WHISPER_TOKEN", "").strip()
ALLOWED_AUDIO_HOST = os.environ.get("OG_ALLOWED_AUDIO_HOST", "").strip().lower()
MODEL_NAME = os.environ.get("WHISPER_MODEL", "base").strip() or "base"
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu").strip() or "cpu"
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8").strip() or "int8"
MAX_AUDIO_BYTES = int(os.environ.get("OG_MAX_AUDIO_BYTES", str(100 * 1024 * 1024)))
JOB_TTL_SECONDS = int(os.environ.get("OG_JOB_TTL_SECONDS", "21600"))
DOWNLOAD_TIMEOUT_SECONDS = int(os.environ.get("OG_AUDIO_DOWNLOAD_TIMEOUT_SECONDS", "60"))

app = FastAPI(title="Dutra Local Whisper", version="1.0.0")
executor = ThreadPoolExecutor(max_workers=max(1, int(os.environ.get("WHISPER_WORKERS", "1"))))
jobs: dict[str, dict] = {}
jobs_lock = threading.Lock()
model_lock = threading.Lock()
model: WhisperModel | None = None
model_error: str | None = None


class CreateJob(BaseModel):
    audioUrl: str = Field(min_length=20, max_length=5000)
    taskId: str = Field(min_length=1, max_length=160)
    language: str = Field(default="pt", min_length=2, max_length=8)


def now_ms() -> int:
    return int(time.time() * 1000)


def auth(token: str | None):
    if len(TOKEN) < 32:
        raise HTTPException(status_code=503, detail="worker_token_not_configured")
    if token != TOKEN:
        raise HTTPException(status_code=401, detail="invalid_worker_token")


def clean_jobs():
    cutoff = now_ms() - JOB_TTL_SECONDS * 1000
    with jobs_lock:
        stale = [job_id for job_id, job in jobs.items() if job.get("updatedAt", 0) < cutoff]
        for job_id in stale:
            jobs.pop(job_id, None)


def validate_audio_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme != "https":
        raise HTTPException(status_code=400, detail="audio_url_must_be_https")
    host = (parsed.hostname or "").lower()
    if not ALLOWED_AUDIO_HOST:
        raise HTTPException(status_code=503, detail="allowed_audio_host_not_configured")
    if host != ALLOWED_AUDIO_HOST:
        raise HTTPException(status_code=400, detail="audio_host_not_allowed")
    return value


def get_model() -> WhisperModel:
    global model, model_error
    if model is not None:
        return model
    with model_lock:
        if model is not None:
            return model
        try:
            model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE_TYPE)
            model_error = None
            return model
        except Exception as exc:
            model_error = str(exc)[:1200]
            raise


def download_audio(url: str, destination: Path):
    total = 0
    with httpx.stream("GET", url, timeout=DOWNLOAD_TIMEOUT_SECONDS, follow_redirects=False) as response:
        response.raise_for_status()
        with destination.open("wb") as handle:
            for chunk in response.iter_bytes(1024 * 1024):
                total += len(chunk)
                if total > MAX_AUDIO_BYTES:
                    raise RuntimeError("audio_too_large")
                handle.write(chunk)
    if total < 44:
        raise RuntimeError("audio_empty")
    return total


def transcribe_job(job_id: str, audio_url: str, language: str):
    with jobs_lock:
        jobs[job_id].update(status="PROCESSING", updatedAt=now_ms())

    suffix = Path(urlparse(audio_url).path).suffix or ".audio"
    try:
        with tempfile.TemporaryDirectory(prefix="dutra-whisper-") as temp_dir:
            audio_path = Path(temp_dir) / ("call" + suffix)
            size = download_audio(audio_url, audio_path)
            whisper = get_model()
            segments_iter, info = whisper.transcribe(
                str(audio_path),
                language=language,
                beam_size=1,
                best_of=1,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 400},
                condition_on_previous_text=False,
                word_timestamps=False,
            )
            segments = []
            texts = []
            for segment in segments_iter:
                text = (segment.text or "").strip()
                if not text:
                    continue
                texts.append(text)
                segments.append({
                    "start": float(segment.start or 0),
                    "end": float(segment.end or 0),
                    "text": text,
                    "speaker": "UNKNOWN",
                })

            transcript = " ".join(texts).strip()
            if not transcript:
                raise RuntimeError("empty_transcript")

            result = {
                "text": transcript,
                "segments": segments,
                "language": getattr(info, "language", language) or language,
                "languageProbability": float(getattr(info, "language_probability", 0) or 0),
                "durationMs": int(float(getattr(info, "duration", 0) or 0) * 1000),
                "audioBytes": size,
                "provider": "faster-whisper",
                "model": MODEL_NAME,
                "device": DEVICE,
                "computeType": COMPUTE_TYPE,
            }
            with jobs_lock:
                jobs[job_id].update(status="READY", result=result, error=None, updatedAt=now_ms())
    except Exception as exc:
        with jobs_lock:
            jobs[job_id].update(status="FAILED", error=str(exc)[:1800], updatedAt=now_ms())


@app.get("/health")
def health(x_og_whisper_token: str | None = Header(default=None)):
    auth(x_og_whisper_token)
    clean_jobs()
    return {
        "ok": True,
        "service": "dutra-local-whisper",
        "model": MODEL_NAME,
        "device": DEVICE,
        "computeType": COMPUTE_TYPE,
        "modelLoaded": model is not None,
        "modelError": model_error,
        "activeJobs": sum(1 for job in jobs.values() if job.get("status") in {"QUEUED", "PROCESSING"}),
    }


@app.post("/jobs")
def create_job(body: CreateJob, x_og_whisper_token: str | None = Header(default=None)):
    auth(x_og_whisper_token)
    clean_jobs()
    audio_url = validate_audio_url(body.audioUrl)
    task_id = re.sub(r"[^A-Za-z0-9._:-]", "_", body.taskId)[:160]
    job_id = str(uuid.uuid4())
    job = {
        "id": job_id,
        "taskId": task_id,
        "status": "QUEUED",
        "createdAt": now_ms(),
        "updatedAt": now_ms(),
        "result": None,
        "error": None,
    }
    with jobs_lock:
        jobs[job_id] = job
    executor.submit(transcribe_job, job_id, audio_url, body.language)
    return job


@app.get("/jobs/{job_id}")
def get_job(job_id: str, x_og_whisper_token: str | None = Header(default=None)):
    auth(x_og_whisper_token)
    clean_jobs()
    with jobs_lock:
        job = jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="job_not_found")
        return dict(job)
