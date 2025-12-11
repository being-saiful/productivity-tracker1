from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="ML Stub Service")

# Allow requests from local dev frontends/backends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClassifyRequest(BaseModel):
    app_name: str
    category: Optional[str] = None
    career: Optional[str] = None

class ClassifyResponse(BaseModel):
    is_productive: Optional[bool]
    confidence: float

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/classify/app", response_model=ClassifyResponse)
async def classify_app(payload: ClassifyRequest):
    # Lightweight heuristic-based stub. This is deliberate so the service
    # starts quickly and avoids heavy ML deps in dev. Set environment
    # MODEL_IMPL=full to attempt to load a real model (best-effort).
    name = (payload.app_name or "").lower()
    productive_hints = [
        'vscode','vs code','code','terminal','git','python','node','intellij','pycharm',
        'notion','figma','photoshop','word','excel','powerpoint'
    ]
    unproductive_hints = [
        'youtube','tiktok','twitter','facebook','instagram','reddit','netflix','discord',
        'tinder','snapchat'
    ]

    # Try optional "real" model only if explicitly requested in env
    if os.environ.get('MODEL_IMPL', '').lower() == 'full':
        try:
            # Attempt to lazily import heavy ML libs; if unavailable we'll fall back
            from transformers import pipeline
            # this is best-effort and may be slow on first call
            classifier = pipeline('text-classification', model='distilbert-base-uncased-finetuned-sst-2-english')
            # create a simple prompt using app name and category
            prompt = f"Is the app '{payload.app_name}' used for productive work or not?"
            result = classifier(prompt, truncation=True)
            # crude mapping: label POSITIVE -> productive
            first = result[0] if isinstance(result, list) and result else None
            if first:
                label = first.get('label', '').lower()
                score = float(first.get('score', 0.0))
                is_prod = True if 'pos' in label or 'productive' in label else False
                return {"is_productive": is_prod, "confidence": round(score, 3)}
        except Exception:
            # fall through to heuristic
            pass

    # Heuristic fallback
    if any(h in name for h in productive_hints):
        return {"is_productive": True, "confidence": 0.6}
    if any(h in name for h in unproductive_hints):
        return {"is_productive": False, "confidence": 0.6}

    # Unknown — allow the backend to handle retries / heuristic later
    return {"is_productive": None, "confidence": 0.0}
