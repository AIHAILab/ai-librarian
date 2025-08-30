from ai_librarian_apis.core.settings import settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def setup_cors(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins or [],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
