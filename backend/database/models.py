"""
SmartFarm AI - SQLAlchemy 2.x Database Models
Defines persistent entities for:
  - Users (farmers and accounts)
  - Fields (soil, NPK, irrigation, and field parameters)
  - Disease Predictions (model inference history and diagnosis)
  - AI Reports (farmer advisories and RAG reference context)
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    String,
    Float,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


def generate_uuid() -> str:
    return uuid.uuid4().hex


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    farm_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    farm_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False
    )

    # Relationships with cascade deletion
    fields: Mapped[List["FieldRecord"]] = relationship(
        "FieldRecord",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    predictions: Mapped[List["DiseasePredictionRecord"]] = relationship(
        "DiseasePredictionRecord",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    reports: Mapped[List["AiReportRecord"]] = relationship(
        "AiReportRecord",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email": self.email,
            "name": self.name,
            "phone": self.phone,
            "preferred_language": self.preferred_language,
            "farm_location": self.farm_location,
            "farm_details": self.farm_details,
            "created_date": self.created_at.isoformat() if self.created_at else None,
        }


class FieldRecord(Base):
    __tablename__ = "fields"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    crop_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    soil_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    soil_ph: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    water_capacity: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    field_size: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    field_size_unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    npk_nitrogen: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    npk_phosphorus: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    npk_potassium: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sowing_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    irrigation_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    field_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    season: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="fields")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "crop_type": self.crop_type,
            "soil_type": self.soil_type,
            "soil_ph": self.soil_ph,
            "water_capacity": self.water_capacity,
            "field_size": self.field_size,
            "field_size_unit": self.field_size_unit,
            "npk_nitrogen": self.npk_nitrogen,
            "npk_phosphorus": self.npk_phosphorus,
            "npk_potassium": self.npk_potassium,
            "sowing_date": self.sowing_date,
            "irrigation_method": self.irrigation_method,
            "field_location": self.field_location,
            "season": self.season,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DiseasePredictionRecord(Base):
    __tablename__ = "disease_predictions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        index=True,
        nullable=True
    )
    crop: Mapped[str] = mapped_column(String(100), nullable=False)
    predicted_disease: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    disease_clean: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    confidence_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="success", nullable=False)
    model_used: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    leaf_crop_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    top3_predictions: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, nullable=True)
    lime_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="predictions")
    reports: Mapped[List["AiReportRecord"]] = relationship(
        "AiReportRecord",
        back_populates="prediction",
        cascade="all, delete-orphan"
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "crop": self.crop,
            "disease": self.predicted_disease,
            "disease_clean": self.disease_clean,
            "confidence": self.confidence,
            "confidence_percent": self.confidence_percent,
            "status": self.status,
            "model_used": self.model_used,
            "imageUrl": self.image_url or self.leaf_crop_url,
            "leaf_crop_url": self.leaf_crop_url,
            "top3_predictions": self.top3_predictions,
            "limeExplanation": {"summary": self.lime_summary} if self.lime_summary else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AiReportRecord(Base):
    __tablename__ = "ai_reports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        index=True,
        nullable=True
    )
    prediction_id: Mapped[Optional[str]] = mapped_column(
        String(64),
        ForeignKey("disease_predictions.id", ondelete="CASCADE"),
        index=True,
        nullable=True
    )
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    report_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    advisory_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rag_sources: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="reports")
    prediction: Mapped[Optional["DiseasePredictionRecord"]] = relationship("DiseasePredictionRecord", back_populates="reports")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "prediction_id": self.prediction_id,
            "language": self.language,
            "report_title": self.report_title,
            "advisory_text": self.advisory_text,
            "rag_sources": self.rag_sources,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
