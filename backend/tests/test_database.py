"""
SmartFarm AI - Phase 2.5 PostgreSQL Database Integration Test Suite
Tests:
  1. Database configuration
  2. SQLAlchemy Base & model registry
  3. Engine creation
  4. Session creation & sessionmaker
  5. Connection status health check
  6. User persistence
  7. User retrieval
  8. Field persistence
  9. Field update
  10. Field retrieval
  11. User isolation (Fields & Predictions)
  12. Prediction persistence
  13. Prediction isolation
  14. AI report persistence & relationship
  15. Health endpoint database payload (with zero secret leakage)
  16. Migration metadata & schema columns
  17. Error rollback behavior
  18. Live PostgreSQL availability check (SKIPPED if PostgreSQL not running)
"""

import os
import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from config import settings
from database.base import Base
from database.models import User, FieldRecord, DiseasePredictionRecord, AiReportRecord
from database.connection import check_database_connection
from database.session import get_db
from main import app


@pytest.fixture(scope="module")
def sqlite_engine():
    """In-memory SQLite engine for fast, isolated unit testing of SQLAlchemy models."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(sqlite_engine):
    """Provides a fresh transactional session for test execution."""
    SessionTesting = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)
    session = SessionTesting()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


# 1. Database Configuration Test
def test_database_configuration():
    """Verify database settings, pool limits, and driver url formatting."""
    assert hasattr(settings, "DATABASE_URL")
    assert hasattr(settings, "DB_POOL_SIZE")
    assert hasattr(settings, "DB_MAX_OVERFLOW")
    assert hasattr(settings, "DB_POOL_TIMEOUT")
    assert settings.DB_POOL_SIZE >= 5
    assert settings.DB_MAX_OVERFLOW >= 10
    
    # Test normalization helper
    norm = settings.sqlalchemy_database_url
    if settings.DATABASE_URL:
        if settings.DATABASE_URL.startswith("postgresql://"):
            assert norm.startswith("postgresql+psycopg://")


# 2. SQLAlchemy Base Test
def test_sqlalchemy_base():
    """Verify declarative base and registered tables."""
    table_names = set(Base.metadata.tables.keys())
    expected_tables = {"users", "fields", "disease_predictions", "ai_reports"}
    assert expected_tables.issubset(table_names), f"Missing tables: {expected_tables - table_names}"


# 3. Engine Creation Test
def test_engine_creation(sqlite_engine):
    """Verify engine creates and executes raw SQL."""
    with sqlite_engine.connect() as conn:
        res = conn.execute(text("SELECT 1")).scalar()
        assert res == 1


# 4. Session Creation Test
def test_session_creation(db_session):
    """Verify sessionmaker creates an active, functional session."""
    assert isinstance(db_session, Session)
    assert db_session.is_active


# 5. Connection Status Test
def test_connection_status(sqlite_engine):
    """Verify check_database_connection safely inspects connection without secret leaks."""
    status = check_database_connection(sqlite_engine)
    assert status["configured"] is True
    assert status["connected"] is True
    assert status["status"] == "connected"
    assert status["driver"] == "sqlite"
    # Ensure no secret leak in returned status
    status_str = str(status)
    assert "password" not in status_str.lower()
    assert "secret" not in status_str.lower()


# 6. User Persistence Test
def test_user_persistence(db_session):
    """Verify User record creation and database insertion."""
    user = User(
        user_id="USR-TEST-001",
        email="testfarmer@smartfarm.local",
        name="Ugesh Raja",
        phone="+919876543210",
        preferred_language="ta",
        farm_location="Thanjavur, Tamil Nadu",
        farm_details={"soil": "Clay Loam", "acreage": 3.5}
    )
    db_session.add(user)
    db_session.commit()

    saved = db_session.execute(select(User).where(User.user_id == "USR-TEST-001")).scalar_one()
    assert saved.id is not None
    assert saved.email == "testfarmer@smartfarm.local"
    assert saved.name == "Ugesh Raja"
    assert saved.preferred_language == "ta"


# 7. User Retrieval Test
def test_user_retrieval(db_session):
    """Verify User record query and dictionary serialization."""
    user = db_session.execute(select(User).where(User.user_id == "USR-TEST-001")).scalar_one_or_none()
    assert user is not None
    user_dict = user.to_dict()
    assert user_dict["user_id"] == "USR-TEST-001"
    assert user_dict["email"] == "testfarmer@smartfarm.local"
    assert "password" not in user_dict  # Passwords must NEVER exist on User model


# 8. Field Persistence Test
def test_field_persistence(db_session):
    """Verify FieldRecord creation linked to authenticated user."""
    field = FieldRecord(
        user_id="USR-TEST-001",
        crop_type="Brinjal",
        soil_type="Loamy",
        soil_ph=6.5,
        water_capacity="70%",
        field_size=2.0,
        field_size_unit="Acre",
        npk_nitrogen=80,
        npk_phosphorus=40,
        npk_potassium=40,
        sowing_date="2026-06-15",
        irrigation_method="Drip",
        field_location="Tamil Nadu",
        season="Kharif"
    )
    db_session.add(field)
    db_session.commit()

    saved_field = db_session.execute(select(FieldRecord).where(FieldRecord.user_id == "USR-TEST-001")).scalar_one()
    assert saved_field.crop_type == "Brinjal"
    assert saved_field.npk_nitrogen == 80
    assert saved_field.soil_ph == 6.5


# 9. Field Update Test
def test_field_update(db_session):
    """Verify updating field agronomic parameters."""
    field = db_session.execute(select(FieldRecord).where(FieldRecord.user_id == "USR-TEST-001")).scalar_one()
    field.npk_nitrogen = 95
    field.soil_ph = 6.8
    field.crop_type = "Tomato"
    db_session.commit()

    updated = db_session.execute(select(FieldRecord).where(FieldRecord.user_id == "USR-TEST-001")).scalar_one()
    assert updated.npk_nitrogen == 95
    assert updated.soil_ph == 6.8
    assert updated.crop_type == "Tomato"


# 10. Field Retrieval Test
def test_field_retrieval(db_session):
    """Verify field querying and serialization to dict."""
    field = db_session.execute(select(FieldRecord).where(FieldRecord.user_id == "USR-TEST-001")).scalar_one()
    f_dict = field.to_dict()
    assert f_dict["crop_type"] == "Tomato"
    assert f_dict["field_size_unit"] == "Acre"
    assert f_dict["user_id"] == "USR-TEST-001"


# 11. User Isolation Test
def test_user_isolation(db_session):
    """CRITICAL: Verify User A can NEVER query User B's fields or records."""
    user_b = User(
        user_id="USR-FARMER-B",
        email="farmerb@smartfarm.local",
        name="Farmer B",
        preferred_language="en"
    )
    db_session.add(user_b)
    db_session.flush()

    field_b = FieldRecord(
        user_id="USR-FARMER-B",
        crop_type="Potato",
        soil_type="Clay",
        soil_ph=5.8,
        field_size=5.0
    )
    db_session.add(field_b)
    db_session.commit()

    # Query fields as User A
    user_a_fields = db_session.execute(select(FieldRecord).where(FieldRecord.user_id == "USR-TEST-001")).scalars().all()
    assert all(f.user_id == "USR-TEST-001" for f in user_a_fields)
    assert not any(f.crop_type == "Potato" for f in user_a_fields)

    # Query fields as User B
    user_b_fields = db_session.execute(select(FieldRecord).where(FieldRecord.user_id == "USR-FARMER-B")).scalars().all()
    assert len(user_b_fields) == 1
    assert user_b_fields[0].crop_type == "Potato"
    assert user_b_fields[0].user_id == "USR-FARMER-B"


# 12. Prediction Persistence Test
def test_prediction_persistence(db_session):
    """Verify storing model prediction result in disease_predictions table."""
    pred = DiseasePredictionRecord(
        user_id="USR-TEST-001",
        crop="Tomato",
        predicted_disease="Tomato___Late_blight",
        disease_clean="Late Blight",
        confidence=0.962,
        confidence_percent=96.2,
        status="success",
        model_used="ResNet-50",
        image_url="/static/predictions/leaf_test.jpg",
        leaf_crop_url="/static/predictions/leaf_test_crop.jpg",
        top3_predictions=[
            {"disease": "Late Blight", "confidence": 0.962},
            {"disease": "Early Blight", "confidence": 0.025},
            {"disease": "Healthy", "confidence": 0.013}
        ],
        lime_summary="Primary feature contributions in upper leaf lamina."
    )
    db_session.add(pred)
    db_session.commit()

    saved_pred = db_session.execute(
        select(DiseasePredictionRecord).where(DiseasePredictionRecord.user_id == "USR-TEST-001")
    ).scalars().first()
    assert saved_pred is not None
    assert saved_pred.crop == "Tomato"
    assert saved_pred.confidence == 0.962
    assert len(saved_pred.top3_predictions) == 3


# 13. Prediction Isolation Test
def test_prediction_isolation(db_session):
    """Verify Farmer A only sees their own predictions."""
    pred_b = DiseasePredictionRecord(
        user_id="USR-FARMER-B",
        crop="Potato",
        predicted_disease="Potato___Early_blight",
        confidence=0.88,
        status="success"
    )
    db_session.add(pred_b)
    db_session.commit()

    # Query for User A
    a_preds = db_session.execute(
        select(DiseasePredictionRecord).where(DiseasePredictionRecord.user_id == "USR-TEST-001")
    ).scalars().all()
    assert all(p.user_id == "USR-TEST-001" for p in a_preds)
    assert not any(p.crop == "Potato" for p in a_preds)


# 14. AI Report Persistence Test
def test_ai_report_persistence(db_session):
    """Verify AI advisory persistence and foreign key linkage to prediction."""
    pred = db_session.execute(
        select(DiseasePredictionRecord).where(DiseasePredictionRecord.user_id == "USR-TEST-001")
    ).scalars().first()
    assert pred is not None

    report = AiReportRecord(
        user_id="USR-TEST-001",
        prediction_id=pred.id,
        language="en",
        report_title="AI Advisory for Late Blight",
        advisory_text="Apply copper fungicide immediately and ensure adequate soil drainage.",
        rag_sources=["tomato_late_blight.txt", "integrated_pest_mgmt.txt"]
    )
    db_session.add(report)
    db_session.commit()

    saved_report = db_session.execute(
        select(AiReportRecord).where(AiReportRecord.prediction_id == pred.id)
    ).scalar_one()
    assert saved_report.report_title == "AI Advisory for Late Blight"
    assert len(saved_report.rag_sources) == 2


# 15. Health Endpoint Database Status Test
def test_health_endpoint():
    """Verify /api/health exposes safe database connectivity status without leaking credentials."""
    client = TestClient(app)
    response = client.get(f"{settings.API_V1_PREFIX}/health")
    assert response.status_code == 200
    data = response.json()
    assert "database" in data
    db_info = data["database"]
    assert "configured" in db_info
    assert "connected" in db_info
    assert "status" in db_info
    # Verify zero secrets
    payload_str = str(data)
    assert "password" not in payload_str.lower()
    assert "postgresql://" not in payload_str.lower()
    assert "psycopg" not in payload_str.lower() or db_info.get("driver") in ["postgresql", "sqlite", None]


# 16. Migration Metadata & Schema Test
def test_migration_metadata_and_schema():
    """Verify Alembic migration script and schema integrity."""
    from alembic.config import Config
    from alembic import script
    from pathlib import Path

    alembic_ini = Path(__file__).resolve().parent.parent / "alembic.ini"
    assert alembic_ini.exists(), "alembic.ini must exist"

    cfg = Config(str(alembic_ini))
    script_dir = script.ScriptDirectory.from_config(cfg)
    heads = script_dir.get_heads()
    assert len(heads) >= 1, "At least one migration revision head must exist"
    assert heads[0] == "0001_initial_schema"


# 17. Error Rollback Behavior Test
def test_error_rollback_behavior(db_session):
    """Verify database transactions roll back automatically on errors without corrupting state."""
    count_before = len(db_session.execute(select(User)).scalars().all())
    try:
        # Intentionally create invalid duplicate user_id
        dup_user = User(
            user_id="USR-TEST-001",  # Duplicate!
            email="another@farm.local",
            name="Duplicate"
        )
        db_session.add(dup_user)
        db_session.commit()
    except Exception:
        db_session.rollback()

    count_after = len(db_session.execute(select(User)).scalars().all())
    assert count_after == count_before, "Transaction failure must roll back cleanly"


# 18. Live PostgreSQL Test (SKIPPED if PostgreSQL not running)
def test_live_postgresql_connection():
    """
    Live PostgreSQL integration test.
    If local PostgreSQL server is not running or unreachable, cleanly SKIPS with clear message.
    """
    db_url = settings.sqlalchemy_database_url
    if not db_url or "sqlite" in db_url:
        pytest.skip("SKIPPED — Local PostgreSQL server not available at DATABASE_URL")

    try:
        engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 15})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        pytest.skip(f"SKIPPED — Local PostgreSQL server not available at DATABASE_URL ({e})")
