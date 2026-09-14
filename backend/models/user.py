from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class FarmDetails(BaseModel):
    farm_area: Optional[str] = Field(default="3.5 Acres", description="Size/Area of the farm")
    primary_crops: Optional[List[str]] = Field(default=["Tomato", "Potato", "Brinjal"], description="Primary crops cultivated")
    soil_type: Optional[str] = Field(default="Red Loamy", description="Predominant soil type")
    irrigation_type: Optional[str] = Field(default="Drip Irrigation", description="Irrigation method")


class UserSignUp(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Farmer's full name")
    email: EmailStr = Field(..., description="Farmer's email address")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")
    phone: Optional[str] = Field(default="+91 98765 43210", description="Contact phone number")
    preferred_language: Literal["en", "ta"] = Field(default="en", description="Preferred language: 'en' for English, 'ta' for Tamil")
    farm_location: Optional[str] = Field(default="Dharmapuri, Tamil Nadu", description="Location of the farm")
    farm_details: Optional[FarmDetails] = Field(default_factory=FarmDetails, description="Farm profile details")


class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="Farmer's email address")
    password: str = Field(..., description="Account password")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Farmer's registered email address")


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    preferred_language: Optional[Literal["en", "ta"]] = None
    farm_location: Optional[str] = None
    farm_details: Optional[FarmDetails] = None


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    phone: Optional[str] = None
    preferred_language: Literal["en", "ta"] = "en"
    farm_location: Optional[str] = None
    farm_details: Optional[Dict[str, Any]] = None
    field_profile: Optional[Dict[str, Any]] = None
    created_date: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
