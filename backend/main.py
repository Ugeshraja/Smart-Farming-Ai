import sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import os
import time
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles

from config import settings
from routes import auth, weather, chat, voice, predict, library, sensors, field, schemes
from services.firebase_service import firebase_service
from services.ai_pipeline_service import ai_pipeline_service
from services.model_bootstrap import bootstrap_models
from database.connection import check_database_connection

logger = logging.getLogger("smartfarm.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Smart Agriculture & AI Farmer Assistant Unified API Layer",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    debug=settings.DEBUG and not settings.is_production
)

# CORS Configuration
origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler for Pydantic validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        errors.append(f"{field}: {err.get('msg')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors
        }
    )


# Global generic exception handler (sanitized in production)
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception: {exc}", exc_info=True)
    detail_msg = f"Internal server error: {str(exc)}" if not settings.is_production else "Internal server error"
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": detail_msg}
    )


# Static Files mounting for generated AI media (leaf crops, segmentation, LIME) and audio
static_path = settings.STATIC_DIR
(static_path / "predictions").mkdir(parents=True, exist_ok=True)
(static_path / "tts").mkdir(parents=True, exist_ok=True)
(settings.CACHE_DIR / "tts").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_path)), name="static")


@app.on_event("startup")
async def startup_event():
    logger.info("Server starting: verifying and bootstrapping AI model checkpoints...")
    try:
        bootstrap_models()
        logger.info("Model bootstrap verification completed successfully.")
    except Exception as e:
        logger.error(f"Error during model bootstrap: {e}")

    logger.info("Loading AI models once into memory...")
    try:
        ai_pipeline_service.initialize()
        logger.info("AI models initialized successfully on startup.")
    except Exception as e:
        logger.error(f"Error during AI model startup initialization: {e}")


# Root & Health check endpoints
@app.get("/", tags=["Health"])
async def root():
    resp = {
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "status": "online"
    }
    if not settings.is_production:
        resp["docs"] = "/docs"
    return resp


@app.get(f"{settings.API_V1_PREFIX}/health", tags=["Health"])
async def health_check():
    rag_files = list(settings.RAG_DIR.glob("*.txt")) if settings.RAG_DIR.exists() else []
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": check_database_connection(),
        "firebase": firebase_service.get_status(),
        "ai_pipeline": {
            "is_loaded": ai_pipeline_service.is_loaded,
            "device": str(ai_pipeline_service.device),
            "models": {
                "yolo": ai_pipeline_service.yolo is not None,
                "sam": ai_pipeline_service.sam_predictor is not None,
                "resnet": ai_pipeline_service.resnet is not None,
                "brinjal_resnet": ai_pipeline_service.brinjal_resnet is not None
            }
        },
        "rag": {
            "available": settings.RAG_DIR.exists(),
            "documents_count": len(rag_files)
        },
        "config_readiness": {
            "gemini_configured": bool(settings.gemini_api_key),
            "database_configured": settings.database_configured,
            "cors_origins_count": len(settings.cors_origins_list)
        }
    }


# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(weather.router, prefix=settings.API_V1_PREFIX)
app.include_router(chat.router, prefix=settings.API_V1_PREFIX)
app.include_router(voice.router, prefix=settings.API_V1_PREFIX)
app.include_router(predict.router, prefix=settings.API_V1_PREFIX)
app.include_router(library.router, prefix=settings.API_V1_PREFIX)
app.include_router(sensors.router, prefix=settings.API_V1_PREFIX)
app.include_router(field.router, prefix=settings.API_V1_PREFIX)
app.include_router(schemes.router, prefix=settings.API_V1_PREFIX)
# Compatibility aliases
app.include_router(predict.router)
app.include_router(library.router)
app.include_router(sensors.router)
app.include_router(field.router)
app.include_router(schemes.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
