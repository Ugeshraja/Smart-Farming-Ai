# SmartFarm AI — Production Deployment Guide

This document defines the comprehensive production deployment specification, operational procedures, environment configurations, and verification standards for the **SmartFarm AI** platform.

---

## 1. System Architecture

SmartFarm AI employs a decoupled, production-ready full-stack architecture designed for high availability, security, and low-latency inference:

```text
                               +-----------------------------+
                               |     End User / Browser      |
                               +-----------------------------+
                                              |
                                              | HTTPS
                                              v
                               +-----------------------------+
                               |   React 18 + Vite Frontend  |
                               |    (Hosted on Vercel CDN)   |
                               +-----------------------------+
                                              |
                                              | HTTPS / WSS
                                              v
                               +-----------------------------+
                               |   FastAPI Backend Server    |
                               |   (Docker Container on      |
                               |    GPU / CPU Cloud Host)    |
                               +-----------------------------+
                                 |       |       |        |
         +-----------------------+       |       |        +----------------------+
         |                               |       |                               |
         v                               v       v                               v
+------------------+         +----------------------+         +--------------------+
| Managed Postgres |         |  Trained AI Models   |         | External Services  |
| (Neon/Supabase)  |         | - YOLO11 (Detection) |         | - Gemini 2.5 Flash |
| - Users          |         | - SAM ViT-B (Seg.)   |         | - Google TTS (gTTS)|
| - My Field       |         | - ResNet-50 (13-cls) |         | - OpenWeather API  |
| - Predictions    |         | - Brinjal ResNet-50  |         | - Firebase Auth    |
| - AI Reports     |         +----------------------+         +--------------------+
+------------------+                     |
                                         v
                             +----------------------+
                             | Hybrid RAG Corpus    |
                             | (21 Verified Guides) |
                             +----------------------+
```

### Critical Operational Characteristics
- **Frontend**: Single-Page Application (SPA) built with React 18, Vite, and Tailwind CSS.
- **Backend**: FastAPI ASGI service with Uvicorn, SQLAlchemy 2.x, Alembic, and PyTorch inference engine.
- **Model Execution Strategy**:
  - **Potato & Tomato Pipeline**: 3-stage cascade (YOLO11 Leaf Localization $\to$ SAM ViT-B Leaf Segmentation $\to$ ResNet-50 13-Class Diagnosis $\to$ LIME Explainability $\to$ RAG Retrieval $\to$ Gemini Advisory). Measured at **12.5s–20.5s on CPU** (up to ~24s under peak load).
  - **Brinjal Pipeline**: Direct single-stage ResNet-50 8-class diagnosis (bypasses YOLO and SAM for rapid response). Measured at **0.13s–0.14s on CPU**.
  - Models are loaded **once at startup** into memory and cached for zero-overhead inference per request.

---

## 2. Frontend Deployment (Vercel)

The React 18 / Vite frontend is optimized for deployment to **Vercel** (or Netlify / Cloudflare Pages).

### Step-by-Step Vercel Deployment
1. Connect the Git repository (`https://github.com/Ugeshraja/Smart-Farming-Ai.git`) in the Vercel Dashboard.
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Configure Environment Variables in Vercel:
   ```env
   VITE_API_BASE_URL=https://<your-deployed-backend-domain>/api
   ```
   *(Note: Never set `GEMINI_API_KEY`, `DATABASE_URL`, or `SECRET_KEY` in Vercel. Frontend variables must strictly only contain public configuration).*
4. Deploy the project. Vercel will output a canonical production domain (e.g., `https://smartfarm-ai.vercel.app`).
5. Set `CORS_ORIGINS` in your backend environment to include this exact Vercel domain.

---

## 3. Backend Deployment (Docker Container)

The backend is packaged into a production-grade Docker container using `backend/Dockerfile` based on `python:3.12-slim-bookworm`.

### Hardware & Timeout Requirements
- **Recommended Architecture (GPU)**:
  - NVIDIA T4 / L4 / A10G GPU with CUDA 12.x support (e.g. AWS ECS/EC2 `g4dn.xlarge`, RunPod, Modal, GCP Cloud Run with GPU).
  - In GPU environments, SAM ViT-B segmentation executes in $<1.5$ seconds.
- **CPU Architecture (Alternative with Extended Timeout)**:
  - Supported on Render, Railway, Fly.io, or AWS ECS Fargate.
  - Minimum Resources: 2 vCPU, 4GB RAM (8GB RAM recommended for PyTorch + SAM ViT-B peak allocations).
  - **MANDATORY TIMEOUT CONFIGURATION**: Because the CPU pipeline requires up to 24 seconds, the reverse proxy and ASGI server timeout must be set to at least **120 seconds** to avoid `504 Gateway Timeout` errors during leaf analysis.

### Startup Command & Port Handling
The Docker container uses dynamic `$PORT` binding to ensure full compatibility with cloud container runners (Render, Railway, Fly.io, Cloud Run):
```dockerfile
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

### Docker Build & Run Commands
```bash
# Build production Docker image from backend directory
cd backend
docker build -t smartfarm-ai-backend:production .

# Run container locally with environment variables injected at runtime
docker run -d \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e PORT=8000 \
  -e SECRET_KEY="your-64-character-jwt-secret-key" \
  -e DATABASE_URL="postgresql+psycopg://username:password@host:5432/dbname" \
  -e GEMINI_API_KEY="your-production-gemini-key" \
  -e CORS_ORIGINS="https://smartfarm-ai.vercel.app" \
  --name smartfarm-backend \
  smartfarm-ai-backend:production
```

---

## 4. Managed PostgreSQL Setup

SmartFarm AI requires PostgreSQL 14, 15, or 16. Managed PostgreSQL can be provisioned via:
- **Supabase** (Free/Pro tier managed Postgres with pgvector/pooling)
- **Neon** (Serverless PostgreSQL with connection pooling)
- **Render Managed PostgreSQL**
- **AWS RDS PostgreSQL / Aurora**

### Connection String Formatting
SmartFarm AI uses SQLAlchemy 2.x and Psycopg 3 (`psycopg[binary]>=3.1.0`). The backend automatically normalizes URLs:
- Format: `postgresql+psycopg://<username>:<password>@<host>:<port>/<dbname>?sslmode=require`
- Connection Pooling: Managed through `backend/config.py` with pre-ping validation:
  - `DB_POOL_SIZE`: 10
  - `DB_MAX_OVERFLOW`: 20
  - `DB_POOL_TIMEOUT`: 30s

---

## 5. Alembic Database Migration Procedure

All relational tables and indexes are managed deterministically through Alembic.

### Running Migrations in Production
Once `DATABASE_URL` is set in the production environment:
```bash
cd backend
python -m alembic upgrade head
```

### Verified Schema Tables & Indexes
1. `users`:
   - Columns: `id` (PK), `user_id` (Unique index), `email` (Unique index), `name`, `phone`, `preferred_language`, `farm_location`, `farm_details` (JSON), `created_at`, `updated_at`.
2. `fields`:
   - Columns: `id` (PK), `user_id` (FK to `users.user_id`, indexed), `crop_type`, `soil_type`, `soil_ph`, `water_capacity`, `field_size`, `field_size_unit`, `npk_nitrogen`, `npk_phosphorus`, `npk_potassium`, `sowing_date`, `irrigation_method`, `field_location`, `season`, `created_at`, `updated_at`.
3. `disease_predictions`:
   - Columns: `id` (PK), `user_id` (FK, indexed), `crop`, `predicted_disease`, `disease_clean`, `confidence`, `confidence_percent`, `status`, `model_used`, `image_url`, `leaf_crop_url`, `top3_predictions` (JSON), `lime_summary`, `created_at` (indexed).
4. `ai_reports`:
   - Columns: `id` (PK), `user_id` (FK, indexed), `prediction_id` (FK, indexed), `language`, `report_title`, `advisory_text`, `rag_sources` (JSON), `created_at` (indexed).

---

## 6. Required Production Environment Variables

### Backend (`backend/.env` or Cloud Host Environment Variables)
| Variable | Required | Description | Example / Production Setting |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | **Yes** | App runtime mode | `production` |
| `PORT` | **Yes** | Listening port (injected by host) | `8000` or `$PORT` |
| `SECRET_KEY` | **Yes** | 64-char random JWT key | `openssl rand -hex 32` |
| `ALGORITHM` | No | JWT encryption algorithm | `HS256` (default) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | JWT validity window | `1440` (24 hours) |
| `CORS_ORIGINS` | **Yes** | Comma-separated trusted origins | `https://smartfarm-ai.vercel.app` (NO `*`) |
| `DATABASE_URL` | **Yes** | PostgreSQL connection URL | `postgresql+psycopg://user:pass@host:5432/dbname` |
| `GEMINI_API_KEY` | **Yes** | Google Gemini Flash LLM key | `AIzaSy...` |
| `LLM_MODEL` | No | Gemini Model ID | `gemini-2.5-flash` |
| `OPENWEATHER_API_KEY` | Optional | Backend weather API key | `32-character OpenWeather key` |
| `FIREBASE_PROJECT_ID` | Optional | Firebase project ID | `smartfarm-ai-project` |
| `FIREBASE_PRIVATE_KEY` | Optional | Service account private key | `-----BEGIN PRIVATE KEY-----\n...` |
| `FIREBASE_CLIENT_EMAIL` | Optional | Service account email | `firebase-adminsdk@...` |

### Frontend (`.env.production` or Vercel Environment Variables)
| Variable | Required | Description | Example / Production Setting |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | Deployed backend API HTTPS URL | `https://<backend-domain>/api` |

---

## 7. Firebase Authentication Configuration

- **Authority**: Firebase Auth / JWT is the sole authority for user identities.
- **Dual Support**:
  1. Production: Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` (or mount `serviceAccountKey.json`).
  2. Simulation: If Firebase credentials are not provided, backend operates in secure local JWT simulation mode for seamless onboarding and evaluation.
- **User Isolation**:
  - All database queries filter strictly by the verified `user_id` in the JWT claim.
  - No user can access or view another user's field data, prediction history, or AI reports.

---

## 8. Gemini API Configuration

- **Backend-Only Security**: `GEMINI_API_KEY` is loaded strictly by `backend/config.py` and is never exposed to the frontend bundle, HTML, or browser storage.
- **Advisory Generation**:
  - Disease advisory integrates verified RAG context with farmer field data to generate actionable remedies.
  - Multi-language support: Generates tailored agronomic advice in English and Tamil (`ta`).

---

## 9. Google TTS (gTTS) Architecture

- **Engine**: Pure Google Text-to-Speech (`gTTS>=2.5.0`).
- **Language Support**: English (`en`) and Tamil (`ta`).
- **Deterministic Caching**:
  - Filenames are generated via `SHA256("gtts|<lang>|<normalized_text>").mp3`.
  - Stored in `backend/static/tts/` and served at `/static/tts/{hash}.mp3`.
  - Cached files are reused instantly without re-querying Google TTS.
- **Network Requirements**:
  - The container host must allow outbound HTTPS connectivity (TCP port 443) to `translate.google.com`.

---

## 10. CORS Configuration

- **Production Security Standard**: Wildcards (`*`) are strictly forbidden in production.
- **Configuration**:
  ```env
  CORS_ORIGINS="https://smartfarm-ai.vercel.app,https://your-custom-domain.com"
  ```
- FastAPIs `CORSMiddleware` automatically validates the origin header against this allowlist, permitting credentials, headers, and standard REST methods (`GET, POST, PUT, DELETE, OPTIONS`).

---

## 11. Canonical Model Files & SHA-256 Hashes

All 4 models must exist inside `backend/models/` and match their exact canonical hashes prior to deployment:

| Model | Path | Size | SHA-256 Hash |
| :--- | :--- | :--- | :--- |
| **YOLO11** | `backend/models/yolo11_best.pt` | 5.43 MB | `c6c025dde69bec47f742bffb5bf59955cf11f4de745016a45638a848ad1418e1` |
| **ResNet-50** | `backend/models/resnet50_best_model.pth` | 94.46 MB | `9fb048609272b0b8aa3111baf930e5cb5adf9b7e25a2d84c781a0d7e911a6f9b` |
| **SAM ViT-B** | `backend/models/sam_vit_b_01ec64.pth` | 375.04 MB | `ec2df62732614e57411cdcf32a23ffdf28910380d03139ee0f4fcbe91eb8c912` |
| **Brinjal ResNet-50** | `backend/models/brinjal/best_model.pth` | 94.41 MB | `463e0595aef3070f1e9ae7eb0f2b81bdf7efbed28d675ccb105ab0620383706c` |

*Total Checkpoint Size: 542.97 MB (Models are baked directly into the Docker image; no runtime download overhead).*

---

## 12. RAG Knowledge Base Corpus

The hybrid RAG system uses 21 verified agronomic knowledge documents in `backend/rag/knowledge_base/`:
- **Potato**: `potato_early_blight.txt`, `potato_late_blight.txt`, `potato_healthy.txt`.
- **Tomato**: `tomato_bacterial_spot.txt`, `tomato_early_blight.txt`, `tomato_healthy.txt`, `tomato_late_blight.txt`, `tomato_leaf_mold.txt`, `tomato_mosaic_virus.txt`, `tomato_septoria_leaf_spot.txt`, `tomato_spider_mites.txt`, `tomato_target_spot.txt`, `tomato_yellow_leaf_curl_virus.txt`.
- **Brinjal**: `brinjal_bacterial_blight.txt`, `brinjal_bacterial_leaf_spot.txt`, `brinjal_bacterial_wilt.txt`, `brinjal_cercospora_leaf_spot.txt`, `brinjal_healthy.txt`, `brinjal_little_leaf.txt`, `brinjal_mosaic_virus.txt`, `brinjal_powdery_mildew.txt`.

---

## 13. Health Check Endpoint

Monitor the production backend via:
```http
GET /api/health
```

### Expected Production Response
```json
{
  "status": "healthy",
  "environment": "production",
  "timestamp": "2026-09-14T08:30:00.000000+00:00",
  "database": {
    "configured": true,
    "connected": true,
    "status": "connected",
    "driver": "postgresql",
    "message": "Database connection verified successfully."
  },
  "firebase": {
    "mode": "production",
    "is_connected": true,
    "firebase_installed": true,
    "project_id": "smartfarm-ai"
  },
  "ai_pipeline": {
    "is_loaded": true,
    "device": "cpu",
    "models": {
      "yolo": true,
      "sam": true,
      "resnet": true,
      "brinjal_resnet": true
    }
  },
  "rag": {
    "available": true,
    "documents_count": 21
  },
  "config_readiness": {
    "gemini_configured": true,
    "database_configured": true,
    "cors_origins_count": 1
  }
}
```

---

## 14. Static Storage & Ephemeral Containers

- Cloud container providers (Render, Fly.io, Cloud Run) offer **ephemeral local filesystems**.
- When containers redeploy or sleep, generated images in `/static/predictions/` and temporary TTS files in `/static/tts/` may be cleared.
- Prediction history records and AI report text are stored **permanently in PostgreSQL**.
- For persistent leaf images in high-scale production, attach an S3/Cloud Storage bucket or persistent volume mount.

---

## 15. Troubleshooting Guide

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| **504 Gateway Timeout on Tomato/Potato** | Reverse proxy timeout $<30$s on CPU host | Increase host timeout to 120s or migrate to GPU instance. |
| **CORS Blocked in Browser** | `CORS_ORIGINS` mismatch | Ensure `CORS_ORIGINS` contains exact frontend domain including `https://` with no trailing slash. |
| **Database `unavailable` in `/api/health`** | Incorrect `DATABASE_URL` or SSL setting | Ensure `sslmode=require` is present for cloud PostgreSQL (e.g. Neon, Supabase). |
| **TTS Audio 404** | Missing outbound internet access on host | Ensure cloud host permits outbound HTTPS (TCP 443) traffic to Google APIs. |
| **Model Out of Memory (OOM)** | Container RAM $<4\text{ GB}$ | Allocate at least 4GB (preferably 8GB) RAM to container. |

---

## 16. Security Standards

1. **Zero Secret Leakage**: No API keys, passwords, or service account files may ever be committed to Git or baked into Docker layers.
2. **Runtime Injection**: All secrets are supplied solely via runtime environment variables.
3. **Strict Origin Control**: Production CORS strictly denies wildcards.
4. **Isolated Farmer Profiles**: Row-level tenant isolation enforced via indexed `user_id` foreign keys on all sensitive tables.
