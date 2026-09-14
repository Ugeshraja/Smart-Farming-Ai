# SmartFarm AI - Local Indic TTS (AI4Bharat) Setup Guide

This guide provides instructions for optionally setting up and running **Local AI4Bharat Indic-TTS** (or Indic Parler-TTS) completely offline on the backend machine.

> [!NOTE]
> **Local Indic TTS is optional.** The SmartFarm AI platform boots and operates cleanly without it, utilizing browser `SpeechSynthesis` and `Sarvam Bulbul v3` fallback. If this local model is not installed, the platform automatically and gracefully falls back to browser voice or Sarvam cloud TTS.

---

## 1. Hardware Requirements

| Parameter | CPU-Only Mode | GPU-Accelerated Mode (Recommended) |
|---|---|---|
| **RAM** | 8 GB minimum (16 GB recommended) | 8 GB system RAM |
| **VRAM** | N/A | 4 GB+ NVIDIA GPU (CUDA 11.8 or 12.x) |
| **Disk Space** | ~2.5 GB for model checkpoints | ~2.5 GB for model checkpoints |
| **Latency** | ~1.5 - 3.5s per sentence | ~200 - 600ms per sentence |

---

## 2. Python Dependencies Installation

In your backend Python environment, install the required audio processing and inference packages:

```bash
cd backend

# 1. PyTorch (ensure matching your CUDA version or CPU)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 2. Hugging Face Transformers and Audio Processing
pip install transformers soundfile scipy imageio-ffmpeg

# 3. (Optional) Indic Parler-TTS / Indic NLP Library
pip install git+https://github.com/huggingface/parler-tts.git
pip install indic-nlp-library
```

---

## 3. Model Download and Setup

Download the AI4Bharat Indic-TTS or Indic Parler-TTS checkpoint weights:

```bash
# Example using Hugging Face CLI or Python
python -c "
from transformers import AutoModelForCausalLM, AutoTokenizer
model_name = 'ai4bharat/indic-parler-tts'
print(f'Downloading {model_name}...')
AutoTokenizer.from_pretrained(model_name)
AutoModelForCausalLM.from_pretrained(model_name)
print('Model weights cached successfully.')
"
```

Alternatively, specify a custom local folder containing the weights:
`LOCAL_INDIC_TTS_MODEL_PATH="models/indic_parler_tts"`

---

## 4. Enabling / Disabling Local Indic TTS

Local Indic TTS is controlled via environment variables in `backend/.env`:

To **Enable**:
```env
ENABLE_LOCAL_INDIC_TTS=true
LOCAL_INDIC_TTS_MODEL_PATH="ai4bharat/indic-parler-tts"
```

To **Disable** (default):
```env
ENABLE_LOCAL_INDIC_TTS=false
```

When disabled, `tts_manager.get_providers_status()` reports `"local_indic_tts": false`, and all requests seamlessly use the Browser Voice and Sarvam fallback chain.

---

## 5. Testing Tamil Speech Synthesis

To verify that your local TTS installation functions properly without starting the entire web frontend:

```bash
python -c "
from services.tts_service import LocalIndicTTSProvider
provider = LocalIndicTTSProvider()
print('Provider Name:', provider.name)
print('Is Available:', provider.is_available())

test_ta = 'வணக்கம் விவசாயி. உங்கள் தக்காளி பயிர் நன்றாக உள்ளது.'
res = provider.synthesize(test_ta, language='ta')
print('Synthesis Result:', res)
"
```

---

## 6. Architecture & Security Confirmation

- **Backend-Only Execution**: The local neural network runs entirely inside FastAPI processes on the backend/server. No models, tensors, or neural network weights are ever pushed to the frontend browser.
- **Zero API Quota Consumption**: When Local Indic TTS is active, Tamil speech requests are synthesized locally and stored in `backend/cache/tts/`, consuming **zero Sarvam credits**.
