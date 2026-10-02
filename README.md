# SmartFarm AI

> **AI-Driven Unified Smart Farming Platform for Early Crop Disease Detection, Intelligent Farmer Advisory, and Sustainable Crop Management Using Explainable Deep Learning, RAG-LLM, and Weather Intelligence**

---

## 🌾 Overview

**SmartFarm AI** is a unified, software-only agricultural intelligence platform built to empower farmers with state-of-the-art artificial intelligence. Engineered specifically for high-value Solanaceae crops (**Tomato, Potato, and Brinjal**), the platform integrates deep learning computer vision, explainable AI (XAI), external meteorological intelligence, dynamic crop planning, and bilingual large language model (LLM) advisory services into a cohesive, responsive web application.

---

## 🏛️ System Architecture

SmartFarm AI is architected strictly as a **100% software-based AI system**:

```text
                     Farmer (User)
                           │
      ┌────────────────────┼────────────────────┐
      ▼                    ▼                    ▼
  Crop Leaf Image     Text Query        Voice Input (Tamil / English)
      │                    │                    │
      └────────────────────┼────────────────────┘
                           ▼
                  FastAPI Backend Gateway
                           │
 ┌─────────────────────────┴─────────────────────────┐
 │                                                   │
 ▼                                                   ▼
1. Computer Vision Pipeline              2. Agricultural Intelligence
   ┌───────────────────────┐                ┌─────────────────────────┐
   │ YOLO11 Leaf Detection │                │ OpenWeather API         │
   └──────────┬────────────┘                │ (Atmospheric Forecasts) │
              ▼                             └───────────┬─────────────┘
   ┌───────────────────────┐                            │
   │ SAM ViT-B Segmentation│                ┌───────────▼─────────────┐
   └──────────┬────────────┘                │ RAG Knowledge Retrieval │
              ▼                             │ (21 Agricultural Docs)  │
   ┌───────────────────────┐                └───────────┬─────────────┘
   │ ResNet-50 Classifier  │                            │
   │ (13 Disease Classes)  │                ┌───────────▼─────────────┐
   └──────────┬────────────┘                │ Agronomic Crop Planner  │
              ▼                             │ & Field Rules Engine    │
   ┌───────────────────────┐                └───────────┬─────────────┘
   │ LIME Explainability   │                            │
   └──────────┬────────────┘                            │
              │                                         │
              └────────────────────┬────────────────────┘
                                   ▼
                      Google Gemini 3.5 Flash LLM
                                   │
                                   ▼
                 Bilingual Farmer Advisory System
                      (English & தமிழ் Voice/TTS)
                                   │
                                   ▼
                  SmartFarm AI Web Application
                     (React 18 + Tailwind CSS)
```

---

## ✨ Core Software Features

### 1. 🍃 Explainable Crop Disease Detection
- **Multi-Stage Deep Learning Pipeline**:
  - **YOLO11**: Localizes individual crop leaves in complex field imagery.
  - **Segment Anything Model (SAM ViT-B)**: Accurately isolates diseased leaf tissue from background soil/debris.
  - **ResNet-50**: Classifies leaf pathology across 13 distinct classes with high confidence.
  - **LIME (Local Interpretable Model-agnostic Explanations)**: Generates visual interpretable superpixel masks highlighting the specific lesion areas influencing the model's prediction.
- **Supported Crops**: Tomato, Potato, and Brinjal (Eggplant).

### 2. 🤖 AI Farmer Assistant (Gemini LLM + RAG)
- **Domain-Specific RAG**: Grounded in a curated vector knowledge base of verified agronomic practices from Tamil Nadu Agricultural University (TNAU) and ICAR.
- **Multimodal & Multilingual**: Supports text and voice interactions in both **English** and **Tamil (தமிழ்)**.
- **Bilingual Voice Engine**: Supports browser SpeechSynthesis, gTTS, and local neural voice synthesis (Piper TTS).

### 3. 🌦️ Weather Intelligence
- **External Meteorological API Integration**: Real-time atmospheric weather data and multi-day forecasting powered by OpenWeather API.
- **Agricultural Weather Advisories**: Automated disease risk warnings based on humidity, temperature thresholds, and rainfall probability.

### 4. 📅 Farming Planner & Field Evaluator
- **Dynamic Crop Timelines**: Sowing-to-harvest schedules for Tomato, Potato, and Brinjal.
- **Field Agronomic Evaluator**: Scientific suitability scoring grounded in TNAU standards evaluating soil pH, NPK balance, and irrigation methods.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Pydantic |
| **Computer Vision** | PyTorch, Ultralytics YOLO11, SAM ViT-B, ResNet-50, LIME |
| **LLM & Advisory** | Google Gemini 3.5 Flash, ChromaDB, LangChain RAG |
| **Database & Auth** | PostgreSQL / Supabase, SQLAlchemy 2.x, Alembic, Firebase Auth |
| **Voice & Audio** | Web Speech API, Google Text-to-Speech (gTTS), Piper ONNX |

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (Python 3.12 recommended)

### 1. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend will be available at `http://localhost:5173`.

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env

# Run FastAPI backend server
uvicorn main:app --reload --port 8000
```
Interactive backend API documentation will be available at `http://localhost:8000/docs`.

---

## 📄 License
This project is licensed under the MIT License.
