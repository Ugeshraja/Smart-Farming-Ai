import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings

# ==============================================================================
# CANONICAL PATH FOUNDATION (Deployment-Ready)
# ==============================================================================
BASE_DIR: Path = Path(__file__).resolve().parent
PROJECT_ROOT: Path = BASE_DIR.parent

MODELS_DIR: Path = BASE_DIR / "models"
STATIC_DIR: Path = BASE_DIR / "static"
CACHE_DIR: Path = BASE_DIR / "cache"
RAG_DIR: Path = BASE_DIR / "rag" / "knowledge_base"
CHROMA_DB_DIR: Path = CACHE_DIR / "chromadb"
ENV_PATH: Path = BASE_DIR / ".env"


def _resolve_model_path(configured_path: str, default_filename: str, sub_dir: Optional[str] = None) -> str:
    """
    Safely resolves a model file path against:
    1. Explicitly configured path if absolute and exists
    2. Explicitly configured path relative to BASE_DIR
    3. Explicitly configured path relative to PROJECT_ROOT
    4. Canonical deployment location inside MODELS_DIR (or sub_dir within MODELS_DIR)
    Never falls back to machine-specific drive letters (C:\\ or G:\\) and never
    silently substitutes a different model when an explicit path is configured.
    """
    canonical = (MODELS_DIR / sub_dir / default_filename) if sub_dir else (MODELS_DIR / default_filename)

    if configured_path:
        norm = configured_path.replace("\\", "/").strip()
        cand = Path(norm)
        if cand.is_absolute() and cand.exists():
            return str(cand.resolve())

        # Check relative to BASE_DIR
        cand_base = (BASE_DIR / norm).resolve()
        if cand_base.exists():
            return str(cand_base)

        # Check relative to PROJECT_ROOT
        cand_proj = (PROJECT_ROOT / norm).resolve()
        if cand_proj.exists():
            return str(cand_proj)

        # If a specific non-default model file was configured but missing,
        # return the unresolved path so the loader fails explicitly without silent substitution
        target_name = os.path.basename(norm)
        if target_name and target_name != default_filename:
            return str(cand_base)

    # Canonical deployment location
    if canonical.exists():
        return str(canonical.resolve())

    return str(canonical)


class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartFarm AI Backend API"
    API_V1_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    DEBUG: bool = True

    # Database Configuration (PostgreSQL readiness)
    DATABASE_URL: str = ""
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30

    # Security / Session settings
    SECRET_KEY: str = "smartfarm-ai-super-secret-jwt-key-2026-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS Settings
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"

    # Firebase Configuration
    FIREBASE_CREDENTIALS_PATH: str = ""
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""

    # LLM & AI Services
    LLM_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-3.8-flash"
    WEATHER_API_KEY: str = ""
    OPENWEATHER_API_KEY: str = ""
    VOICE_API_KEY: str = ""

    # Trained AI Models Configuration (Deployment-Ready Relative Defaults)
    MODEL_DIR: str = "models"
    YOLO_MODEL_PATH: str = "models/yolo11_best.pt"
    RESNET_MODEL_PATH: str = "models/resnet50_best_model.pth"
    SAM_MODEL_PATH: str = "models/sam_vit_b_01ec64.pth"
    BRINJAL_RESNET_MODEL_PATH: str = "models/brinjal/best_model.pth"
    RAG_KNOWLEDGE_PATH: str = "rag/knowledge_base"
    CHROMA_DB_DIR: str = str(CHROMA_DB_DIR)

    # Hugging Face Model Repository Configuration (Private Model Hosting)
    HF_MODEL_REPO_ID: str = "ugeshraja007/smartfarm-ai-models"
    HF_TOKEN: str = ""
    HF_MODEL_REVISION: str = "main"

    # Environment & Database status accessors
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "production"

    @property
    def is_development(self) -> bool:
        return not self.is_production

    @property
    def database_configured(self) -> bool:
        return bool(self.DATABASE_URL.strip())

    @property
    def sqlalchemy_database_url(self) -> str:
        """
        Normalizes DATABASE_URL for SQLAlchemy 2.x and Psycopg 3.
        Maps postgresql:// to postgresql+psycopg:// if not explicitly specified.
        Ensures SSL compatibility for remote/Supabase PostgreSQL.
        """
        raw = self.DATABASE_URL.strip()
        if not raw:
            return ""
        if raw.startswith("postgres://"):
            raw = raw.replace("postgres://", "postgresql+psycopg://", 1)
        elif raw.startswith("postgresql://"):
            raw = raw.replace("postgresql://", "postgresql+psycopg://", 1)

        # Ensure sslmode=require for Supabase and remote PostgreSQL endpoints if not specified
        if "sslmode=" not in raw and ("supabase" in raw or "pooler" in raw or ".com" in raw or ".net" in raw):
            delimiter = "&" if "?" in raw else "?"
            raw = f"{raw}{delimiter}sslmode=require"

        return raw

    # Base directory accessors
    @property
    def base_dir(self) -> Path:
        return BASE_DIR

    @property
    def BASE_DIR(self) -> Path:
        return BASE_DIR

    @property
    def MODELS_DIR(self) -> Path:
        return MODELS_DIR

    @property
    def STATIC_DIR(self) -> Path:
        return STATIC_DIR

    @property
    def CACHE_DIR(self) -> Path:
        return CACHE_DIR

    @property
    def RAG_DIR(self) -> Path:
        return RAG_DIR

    @property
    def ENV_PATH(self) -> Path:
        return ENV_PATH

    @property
    def clean_yolo_path(self) -> str:
        return _resolve_model_path(self.YOLO_MODEL_PATH, "yolo11_best.pt")

    @property
    def clean_resnet_path(self) -> str:
        return _resolve_model_path(self.RESNET_MODEL_PATH, "resnet50_best_model.pth")

    @property
    def clean_brinjal_resnet_path(self) -> str:
        # Check specific brinjal sub-directory first, then models root
        configured = self.BRINJAL_RESNET_MODEL_PATH
        return _resolve_model_path(configured, "best_model.pth", sub_dir="brinjal")

    @property
    def clean_sam_path(self) -> str:
        return _resolve_model_path(self.SAM_MODEL_PATH, "sam_vit_b_01ec64.pth")

    @property
    def clean_rag_path(self) -> str:
        if self.RAG_KNOWLEDGE_PATH:
            norm = self.RAG_KNOWLEDGE_PATH.replace("\\", "/").strip()
            cand = Path(norm)
            if cand.is_absolute() and cand.exists():
                return str(cand.resolve())
            cand_base = (BASE_DIR / norm).resolve()
            if cand_base.exists():
                return str(cand_base)
            cand_proj = (PROJECT_ROOT / norm).resolve()
            if cand_proj.exists():
                return str(cand_proj)
        if RAG_DIR.exists():
            return str(RAG_DIR.resolve())
        return str(RAG_DIR)

    @property
    def clean_firebase_credentials_path(self) -> str:
        if self.FIREBASE_CREDENTIALS_PATH:
            cand = Path(self.FIREBASE_CREDENTIALS_PATH.replace("\\", "/").strip())
            if cand.is_absolute() and cand.exists():
                return str(cand.resolve())
            cand_base = (BASE_DIR / cand).resolve()
            if cand_base.exists():
                return str(cand_base)
            cand_proj = (PROJECT_ROOT / cand).resolve()
            if cand_proj.exists():
                return str(cand_proj)
        # Check default serviceAccountKey.json location in backend or project root
        default_base = BASE_DIR / "serviceAccountKey.json"
        if default_base.exists():
            return str(default_base.resolve())
        default_proj = PROJECT_ROOT / "serviceAccountKey.json"
        if default_proj.exists():
            return str(default_proj.resolve())
        return ""

    @property
    def gemini_api_key(self) -> str:
        key = (
            self.LLM_API_KEY
            or self.GEMINI_API_KEY
            or os.environ.get("LLM_API_KEY", "")
            or os.environ.get("GEMINI_API_KEY", "")
        ).strip()
        if key:
            return key

        # Dynamic fallback: check backend/.env on disk if not loaded into process environment
        if ENV_PATH.exists():
            try:
                with open(ENV_PATH, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("#") or "=" not in line:
                            continue
                        k_name, _, k_val = line.partition("=")
                        k_name = k_name.strip()
                        k_val = k_val.strip().strip('"').strip("'")
                        if k_name in ("GEMINI_API_KEY", "LLM_API_KEY") and k_val:
                            return k_val
            except Exception:
                pass
        return ""

    @property
    def voice_api_key(self) -> str:
        key = (
            self.VOICE_API_KEY
            or os.environ.get("VOICE_API_KEY", "")
        ).strip()
        if key:
            return key

        if ENV_PATH.exists():
            try:
                with open(ENV_PATH, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("#") or "=" not in line:
                            continue
                        k_name, _, k_val = line.partition("=")
                        k_name = k_name.strip()
                        k_val = k_val.strip().strip('"').strip("'")
                        if k_name == "VOICE_API_KEY" and k_val:
                            return k_val
            except Exception:
                pass
        return ""

    @property
    def hf_token(self) -> str:
        token = (
            self.HF_TOKEN
            or os.environ.get("HF_TOKEN", "")
        ).strip()
        if token:
            return token

        if ENV_PATH.exists():
            try:
                with open(ENV_PATH, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("#") or "=" not in line:
                            continue
                        k_name, _, k_val = line.partition("=")
                        k_name = k_name.strip()
                        k_val = k_val.strip().strip('"').strip("'")
                        if k_name == "HF_TOKEN" and k_val:
                            return k_val
            except Exception:
                pass
        return ""

    @property
    def openweather_key(self) -> str:
        return (
            self.OPENWEATHER_API_KEY
            or self.WEATHER_API_KEY
            or os.environ.get("OPENWEATHER_API_KEY", "")
            or os.environ.get("WEATHER_API_KEY", "")
        )

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS or not self.CORS_ORIGINS.strip():
            if self.is_development:
                return ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"]
            return []
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    def validate_configuration(self) -> dict:
        """
        Validates backend configuration readiness for current environment.
        Identifies missing configurations safely without exposing secret values.
        """
        issues = []
        if not self.gemini_api_key:
            issues.append("Gemini API key is not configured.")

        if self.is_production:
            if self.SECRET_KEY == "smartfarm-ai-super-secret-jwt-key-2026-secure":
                issues.append("SECRET_KEY is using the default development key in production.")
            if not self.DATABASE_URL:
                issues.append("Database URL is not configured.")
            if not self.cors_origins_list or "*" in self.cors_origins_list:
                issues.append("CORS_ORIGINS should specify explicit trusted domains in production.")

        models_status = {
            "yolo11": Path(self.clean_yolo_path).exists(),
            "resnet50": Path(self.clean_resnet_path).exists(),
            "sam_vit_b": Path(self.clean_sam_path).exists(),
            "brinjal_resnet50": Path(self.clean_brinjal_resnet_path).exists(),
        }
        missing_models = [k for k, v in models_status.items() if not v]
        if missing_models:
            issues.append(f"Missing required model files: {', '.join(missing_models)}")

        return {
            "environment": self.ENVIRONMENT,
            "is_production": self.is_production,
            "is_valid": len(issues) == 0,
            "issues": issues,
            "models_present": models_status,
            "rag_present": Path(self.clean_rag_path).exists(),
            "gemini_configured": bool(self.gemini_api_key),
            "hf_configured": bool(self.hf_token),
            "database_configured": self.database_configured,
            "cors_origins_count": len(self.cors_origins_list)
        }

    class Config:
        env_file = str(ENV_PATH)
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
