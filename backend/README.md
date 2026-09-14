# SmartFarm AI Backend API

Modular FastAPI backend service for the SmartFarm AI agricultural decision platform.

## Architecture

```
backend/
├── main.py                    # FastAPI application & middleware
├── config.py                  # Pydantic environment configuration
├── routes/
│   ├── auth.py                # Sign up, Login, Profile, Password Reset
├── services/
│   ├── firebase_service.py    # Firebase Auth & Firestore client
├── models/
│   ├── user.py                # Pydantic schemas for Auth & Profiles
├── tests/
│   ├── test_auth.py           # Verification test suite
├── requirements.txt           # Python dependencies
├── .env.example               # Environment variables template
└── README.md
```

## Setup & Installation

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

To connect to live Firebase:
1. Go to Firebase Console -> Project Settings -> Service Accounts.
2. Click **Generate New Private Key** to download the JSON file.
3. Save it as `serviceAccountKey.json` inside the `backend/` folder and set:
   ```env
   FIREBASE_CREDENTIALS_PATH="serviceAccountKey.json"
   ```
   Or set individual environment variables:
   ```env
   FIREBASE_PROJECT_ID="your-project-id"
   FIREBASE_CLIENT_EMAIL="your-service-account-email"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
*(Note: If no Firebase credentials are provided, the backend seamlessly runs in Development Simulation Mode, preserving all data for local testing).*

### 3. Run Backend Server
```bash
uvicorn main:app --reload --port 8000
```
Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/api/health`

### 4. Run Automated Tests
```bash
pytest tests/test_auth.py -v
python tests/test_tts_hybrid.py
```

## Hybrid Voice & Text-to-Speech (TTS) Architecture

SmartFarm AI employs a multi-tiered hybrid TTS system prioritizing authentic local and cloud synthesis with text preservation.

### Tamil TTS Provider Hierarchy:
1. **Browser SpeechSynthesis**: Client-side speech synthesis using `ta-IN` / `ta` voices when installed on the client machine.
2. **Local Indic TTS**: Offline neural voice engine (AI4Bharat / Coqui TTS) when installed locally.
3. **gTTS (Google Text-to-Speech)**: Primary backend cloud fallback generating high-quality MP3 audio streams for Tamil (`lang="ta"`). *Note: gTTS requires internet connectivity.*
4. **Sarvam Bulbul v3**: Secondary backend cloud provider (`ta-IN`) with SHA256 disk caching and chunking.
5. **Text-Only Fallback**: If all voice providers are unavailable or offline, the AI agricultural advice remains 100% visible and interactive without failing the request.

