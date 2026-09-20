import os
import sys
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
TTS_MODELS_DIR = BASE_DIR / "models" / "tts"

MODELS = [
    {
        "name": "Tamil (ta_IN-rasa_female-medium)",
        "dir": TTS_MODELS_DIR / "tamil",
        "files": [
            {
                "filename": "ta_IN-rasa_female-medium.onnx",
                "url": "https://huggingface.co/tinisoft/piper-ta_IN-rasa_female-medium/resolve/main/ta_IN-rasa_female-medium.onnx",
                "min_size": 30 * 1024 * 1024  # > 30MB
            },
            {
                "filename": "ta_IN-rasa_female-medium.onnx.json",
                "url": "https://huggingface.co/tinisoft/piper-ta_IN-rasa_female-medium/resolve/main/ta_IN-rasa_female-medium.onnx.json",
                "min_size": 500  # JSON metadata
            }
        ]
    },
    {
        "name": "English (en_US-lessac-medium)",
        "dir": TTS_MODELS_DIR / "english",
        "files": [
            {
                "filename": "en_US-lessac-medium.onnx",
                "url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
                "min_size": 30 * 1024 * 1024  # > 30MB
            },
            {
                "filename": "en_US-lessac-medium.onnx.json",
                "url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
                "min_size": 500  # JSON metadata
            }
        ]
    }
]


def download_file(url: str, dest_path: Path, min_size: int):
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    if dest_path.exists() and dest_path.stat().st_size >= min_size:
        print(f"[EXISTS] {dest_path.name} ({dest_path.stat().st_size / (1024*1024):.2f} MB)")
        return

    print(f"[DOWNLOADING] {dest_path.name} from {url}...")
    temp_path = dest_path.with_suffix(".tmp")
    try:
        urllib.request.urlretrieve(url, temp_path)
        actual_size = temp_path.stat().st_size
        if actual_size < min_size:
            temp_path.unlink(missing_ok=True)
            raise ValueError(f"Downloaded file {dest_path.name} is too small: {actual_size} bytes (expected >= {min_size})")
        temp_path.replace(dest_path)
        print(f"[DOWNLOADED] {dest_path.name} ({actual_size / (1024*1024):.2f} MB)")
    except Exception as e:
        temp_path.unlink(missing_ok=True)
        print(f"[ERROR] Failed to download {dest_path.name}: {e}")
        raise


def main():
    print(f"=== Piper TTS Model Downloader ===")
    print(f"Target directory: {TTS_MODELS_DIR}")
    for model_group in MODELS:
        print(f"\nProcessing {model_group['name']}...")
        for item in model_group["files"]:
            target_file = model_group["dir"] / item["filename"]
            download_file(item["url"], target_file, item["min_size"])
    print("\nAll Piper TTS models are downloaded and verified successfully!")


if __name__ == "__main__":
    main()
