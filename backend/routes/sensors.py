"""
SmartFarm AI - Sensor Telemetry Routes (ESP32 IoT Integration)
Provides latest sensor readings, historical telemetry, and ingestion endpoints.
"""

import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel

router = APIRouter(prefix="/sensors", tags=["Sensors & IoT"])

class SensorTelemetryPayload(BaseModel):
    soil_moisture: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rain_detected: Optional[bool] = None
    node_id: Optional[str] = "esp32-node-1"

# In-memory latest telemetry state
LATEST_TELEMETRY: Dict[str, Any] = {
    "soilMoisture": 62,
    "temperature": 29.5,
    "humidity": 76,
    "rainDetected": False,
    "timestamp": "Just now",
    "status": "Optimal",
    "node_id": "esp32-node-1"
}

def generate_sensor_history() -> List[Dict[str, Any]]:
    """Generate realistic 24-hour sensor history readings."""
    now = datetime.now(timezone.utc)
    history = []
    base_temps = [24, 23.5, 23, 23, 23.5, 24.5, 26, 28, 30, 31.5, 32, 31, 30, 29.5]
    for i in range(12):
        reading_time = (now - timedelta(hours=(11 - i) * 2)).strftime("%I:%M %p")
        temp = base_temps[i % len(base_temps)]
        history.append({
            "time": reading_time,
            "soilMoisture": round(60 + (i % 5) * 1.5, 1),
            "temperature": round(temp, 1),
            "humidity": round(70 + (i % 4) * 2.5, 1),
            "rainDetected": i == 8
        })
    return history

@router.get("/latest")
async def get_latest_sensors():
    """Retrieve the most recent IoT sensor telemetry reading."""
    return LATEST_TELEMETRY

@router.get("/history")
async def get_sensor_history():
    """Retrieve historical telemetry data points for visualization and analytics."""
    return generate_sensor_history()

@router.post("/telemetry", status_code=status.HTTP_201_CREATED)
async def ingest_sensor_telemetry(payload: SensorTelemetryPayload):
    """Ingest live sensor packet from ESP32 node."""
    if payload.soil_moisture is not None:
        LATEST_TELEMETRY["soilMoisture"] = payload.soil_moisture
    if payload.temperature is not None:
        LATEST_TELEMETRY["temperature"] = payload.temperature
    if payload.humidity is not None:
        LATEST_TELEMETRY["humidity"] = payload.humidity
    if payload.rain_detected is not None:
        LATEST_TELEMETRY["rainDetected"] = payload.rain_detected
    if payload.node_id:
        LATEST_TELEMETRY["node_id"] = payload.node_id
        
    LATEST_TELEMETRY["timestamp"] = datetime.now(timezone.utc).strftime("%I:%M %p")
    return {"status": "success", "data": LATEST_TELEMETRY}
