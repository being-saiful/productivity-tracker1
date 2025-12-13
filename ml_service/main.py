from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="ML Stub Service")

# Allow requests from backend / frontend
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
    name = (payload.app_name or "").lower()

    productive_hints = [
        "vscode", "vs code", "code", "terminal", "git", "python", "node",
        "intellij", "pycharm", "notion", "figma", "photoshop",
        "word", "excel", "powerpoint"
    ]

    unproductive_hints = [
        "youtube", "tiktok", "twitter", "facebook", "instagram",
        "reddit", "netflix", "discord", "tinder", "snapchat"
    ]

    # Optional heavy ML (disabled by default)
    if os.environ.get("MODEL_IMPL", "").lower() == "full":
        try:
            from transformers import pipeline
            classifier = pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english"
            )
            prompt = f"Is the app '{payload.app_name}' productive or not?"
            result = classifier(prompt, truncation=True)

            if result and isinstance(result, list):
                first = result[0]
                label = first.get("label", "").lower()
                score = float(first.get("score", 0.0))
                return {
                    "is_productive": "pos" in label,
                    "confidence": round(score, 3)
                }
        except Exception:
            pass  # fallback to heuristic

    # Heuristic fallback
    if any(h in name for h in productive_hints):
        return {"is_productive": True, "confidence": 0.6}

    if any(h in name for h in unproductive_hints):
        return {"is_productive": False, "confidence": 0.6}

    return {"is_productive": None, "confidence": 0.0}
