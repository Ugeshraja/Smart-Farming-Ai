"""
SmartFarm AI - Field Profile Schema
Represents the farmer's physical field/farm characteristics and agronomic parameters.
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class FieldProfile(BaseModel):
    crop_type: str = Field(default="Brinjal", description="Primary cultivated crop")
    soil_type: str = Field(default="Loamy", description="Predominant soil type")
    soil_ph: float = Field(default=6.4, ge=3.0, le=11.0, description="Soil pH reading")
    water_capacity: str = Field(default="72%", description="Soil water holding capacity")
    field_size: float = Field(default=2.0, gt=0, description="Land area quantity")
    field_size_unit: Literal["Acre", "Hectare", "acre", "hectare"] = Field(
        default="Acre",
        description="Measurement unit for land size"
    )
    npk_nitrogen: int = Field(default=80, ge=0, description="Nitrogen level (kg/ha or index)")
    npk_phosphorus: int = Field(default=40, ge=0, description="Phosphorus level (kg/ha or index)")
    npk_potassium: int = Field(default=40, ge=0, description="Potassium level (kg/ha or index)")
    sowing_date: Optional[str] = Field(default="2026-06-15", description="Sowing or transplanting date (YYYY-MM-DD)")
    irrigation_method: str = Field(
        default="Drip",
        description="Method of irrigation (Drip, Sprinkler, Flood, Rain-fed, Other)"
    )
    field_location: str = Field(default="Tamil Nadu", description="Geographical field location / state")
    season: str = Field(default="Kharif", description="Current cropping season (Kharif, Rabi, Zaid / Summer)")

    class Config:
        json_schema_extra = {
            "example": {
                "crop_type": "Brinjal",
                "soil_type": "Loamy",
                "soil_ph": 6.4,
                "water_capacity": "72%",
                "field_size": 2.0,
                "field_size_unit": "Acre",
                "npk_nitrogen": 80,
                "npk_phosphorus": 40,
                "npk_potassium": 40,
                "sowing_date": "2026-06-15",
                "irrigation_method": "Drip",
                "field_location": "Tamil Nadu",
                "season": "Kharif"
            }
        }


class FieldProfileUpdate(BaseModel):
    crop_type: Optional[str] = None
    soil_type: Optional[str] = None
    soil_ph: Optional[float] = None
    water_capacity: Optional[str] = None
    field_size: Optional[float] = None
    field_size_unit: Optional[str] = None
    npk_nitrogen: Optional[int] = None
    npk_phosphorus: Optional[int] = None
    npk_potassium: Optional[int] = None
    sowing_date: Optional[str] = None
    irrigation_method: Optional[str] = None
    field_location: Optional[str] = None
    season: Optional[str] = None
