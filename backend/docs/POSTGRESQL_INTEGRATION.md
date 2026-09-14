# SmartFarm AI — PostgreSQL Database Integration Guide (Phase 2.5)

## 1. Overview & Architecture

SmartFarm AI incorporates a clean, production-ready PostgreSQL persistence layer powered by SQLAlchemy 2.x and Alembic. The React frontend communicates strictly with FastAPI via REST endpoints; **React NEVER connects directly to PostgreSQL**.

```
[ React 18 Frontend ]
         │ (HTTPS / Bearer JWT)
         ▼
[ FastAPI Backend Layer ]
         │ (SQLAlchemy 2.x ORM / Connection Pool)
         ▼
[ PostgreSQL Database ]
```

---

## 2. Technology Stack & Driver

- **Database**: PostgreSQL (v14+)
- **ORM**: SQLAlchemy 2.x (`sqlalchemy>=2.0.0`)
- **Migrations**: Alembic (`alembic>=1.13.0`)
- **Driver**: `psycopg` 3 (`psycopg[binary]>=3.1.0`)
- **Dialect Scheme**: `postgresql+psycopg://`

Connection URL normalization is automatic in `backend/config.py`: standard `postgresql://` or `postgres://` prefixes in `DATABASE_URL` are safely mapped to `postgresql+psycopg://`.

---

## 3. Configuration & Secrets Management

Database credentials reside strictly in the server environment (`.env`) and are accessed via `backend/config.py`:

```env
# backend/.env (Safe Placeholder)
DATABASE_URL="postgresql+psycopg://username:password@localhost:5432/smartfarm_ai"

# Connection Pooling
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=30
```

### Security Guarantees:
- `DATABASE_URL`, usernames, and passwords are **never logged**, returned in API responses, or exposed through `/api/health`.
- The health check (`GET /api/health`) reports only safe statuses: `configured: true/false`, `connected: true/false`, `status: "connected" | "unavailable" | "not_configured"`, and dialect name (e.g., `postgresql`).

---

## 4. Local Setup & Migration Commands

### Prerequisites:
1. Install PostgreSQL 14+ on the host or run via Docker:
   ```bash
   docker run --name smartfarm-postgres -e POSTGRES_DB=smartfarm_ai -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16-alpine
   ```
2. Configure `DATABASE_URL` in `backend/.env`.

### Run Alembic Migrations:
```bash
# In backend/ directory:
alembic upgrade head
```

### Rollback / Migration Inspection:
```bash
# Check current revision
alembic current

# Rollback one revision
alembic downgrade -1
```

---

## 5. Database Schema & Tables

All entities inherit from `SQLAlchemy 2.0 DeclarativeBase` in `backend/database/base.py`.

### A. `users` Table
Stores farmer profile information synchronized with the authentication authority (Firebase Auth / JWT).
- **id** (`VARCHAR(64)`, Primary Key): Internal UUID.
- **user_id** (`VARCHAR(64)`, Unique, Indexed): Authenticated user identifier (e.g., Firebase UID).
- **email** (`VARCHAR(255)`, Unique, Indexed): Verified email address.
- **name** (`VARCHAR(255)`): Farmer name.
- **phone** (`VARCHAR(50)`, Nullable): Contact phone number.
- **preferred_language** (`VARCHAR(10)`): Farmer language preference (`en` or `ta`).
- **farm_location** (`VARCHAR(255)`, Nullable): Geographic farm location.
- **farm_details** (`JSON`, Nullable): Extensible agricultural details.
- **created_at** (`TIMESTAMPTZ`): UTC creation timestamp.
- **updated_at** (`TIMESTAMPTZ`): UTC update timestamp.

*Note: No password column exists in PostgreSQL. Authentication authority remains Firebase/JWT.*

### B. `fields` Table
Stores farmer-entered agronomic soil, irrigation, and crop parameters for My Field.
- **id** (`VARCHAR(64)`, Primary Key): UUID.
- **user_id** (`VARCHAR(64)`, ForeignKey `users.user_id`, On Delete CASCADE, Indexed): Owner farmer.
- **crop_type** (`VARCHAR(100)`, Nullable): Active crop (e.g., Brinjal, Tomato, Potato).
- **soil_type** (`VARCHAR(100)`, Nullable): Soil classification (e.g., Loamy, Clay, Sandy).
- **soil_ph** (`FLOAT`, Nullable): Soil pH value (e.g., 6.4).
- **water_capacity** (`VARCHAR(50)`, Nullable): Water holding capacity percentage (e.g., "72%").
- **field_size** (`FLOAT`, Nullable): Acreage/area value.
- **field_size_unit** (`VARCHAR(50)`, Nullable): Unit (e.g., "Acre", "Hectare").
- **npk_nitrogen** (`INT`, Nullable): Available nitrogen (kg/ha).
- **npk_phosphorus** (`INT`, Nullable): Available phosphorus (kg/ha).
- **npk_potassium** (`INT`, Nullable): Available potassium (kg/ha).
- **sowing_date** (`VARCHAR(50)`, Nullable): Sowing/planting date.
- **irrigation_method** (`VARCHAR(100)`, Nullable): Irrigation type (e.g., Drip, Sprinkler, Flood).
- **field_location** (`VARCHAR(255)`, Nullable): Field location.
- **season** (`VARCHAR(100)`, Nullable): Cropping season (Kharif, Rabi, Zaid).
- **created_at** / **updated_at** (`TIMESTAMPTZ`): UTC timestamps.

### C. `disease_predictions` Table
Maintains diagnosis inference history for uploaded plant leaves.
- **id** (`VARCHAR(64)`, Primary Key): UUID / Prediction ID.
- **user_id** (`VARCHAR(64)`, ForeignKey `users.user_id`, On Delete SET NULL, Indexed): Owner farmer.
- **crop** (`VARCHAR(100)`): Evaluated crop name.
- **predicted_disease** (`VARCHAR(255)`): Raw class name (e.g., `Tomato___Late_blight`).
- **disease_clean** (`VARCHAR(255)`): Clean display name (e.g., "Late Blight").
- **confidence** (`FLOAT`): Top-1 probability score (0.0 to 1.0).
- **confidence_percent** (`FLOAT`): Top-1 confidence percentage (0.0 to 100.0).
- **status** (`VARCHAR(50)`): Inference status (`success`, `warning`, `out_of_distribution`).
- **model_used** (`VARCHAR(100)`): Classifier name (e.g., `ResNet-50`, `Brinjal-ResNet-50`).
- **image_url** (`VARCHAR(500)`): Relative static path to uploaded leaf image.
- **leaf_crop_url** (`VARCHAR(500)`): Relative static path to YOLO/SAM isolated leaf crop.
- **top3_predictions** (`JSON`): Top 3 disease candidates with confidence scores.
- **lime_summary** (`TEXT`): Human-readable textual explanation of leaf features.
- **created_at** (`TIMESTAMPTZ`, Indexed): UTC timestamp.

### D. `ai_reports` Table
Stores generated Gemini farmer advisories and RAG reference context.
- **id** (`VARCHAR(64)`, Primary Key): UUID.
- **user_id** (`VARCHAR(64)`, ForeignKey `users.user_id`, On Delete SET NULL, Indexed): Owner farmer.
- **prediction_id** (`VARCHAR(64)`, ForeignKey `disease_predictions.id`, On Delete CASCADE, Indexed).
- **language** (`VARCHAR(10)`): Advisory language (`en` or `ta`).
- **report_title** (`VARCHAR(255)`): Generated title.
- **advisory_text** (`TEXT`): Full LLM agricultural guidance.
- **rag_sources** (`JSON`): List of referenced knowledge-base text documents.
- **created_at** (`TIMESTAMPTZ`, Indexed): UTC timestamp.

---

## 6. Separation of Concerns: Database vs. Storage

| Data Category | Storage Target | Rationale |
| :--- | :--- | :--- |
| User Profile & Language | PostgreSQL (`users`) | Structured relational identity |
| Field Agronomic Params | PostgreSQL (`fields`) | Fast indexed retrieval & persistence |
| Disease Inference Metadata | PostgreSQL (`disease_predictions`) | Queryable history, sorting, filtering |
| AI Farmer Advisory Content | PostgreSQL (`ai_reports`) | Historical agronomic reference |
| AI Model Checkpoints (`.pt`, `.pth`) | Host Filesystem (`backend/models/`) | High-throughput binary model weights |
| Leaf Crop & Mask Images | Static Storage (`backend/static/predictions/`) | Low-latency static file serving |
| Generated Voice Audio (`.mp3`) | Cache & Static (`backend/static/tts/`) | Reusable deterministic gTTS files |
| RAG Agricultural Documents | Knowledge Base (`backend/rag/knowledge_base/`) | 21 domain knowledge text files |

---

## 7. User Isolation & Security

User isolation is enforced strictly on the backend:
1. All queries for `fields`, `predictions`, and `reports` explicitly filter by `user_id == authenticated_user_id`.
2. Frontend filters are purely visual; backend database queries guarantee that Farmer A can never access Farmer B's field profiles or predictions.
3. If unauthenticated, access is restricted or falls back safely in dev mode without exposing cross-user records.

---

## 8. Production Considerations

- **Connection Pool Tuning**: By default, `QueuePool` maintains 10 persistent connections (`DB_POOL_SIZE = 10`) with up to 20 overflow connections (`DB_MAX_OVERFLOW = 20`).
- **Liveness Checking**: `pool_pre_ping=True` prevents stale connection errors across server reboots or firewalls.
- **Non-blocking Startup**: Database connectivity is not required for application initialization. The application gracefully reports database availability through `/api/health`.
