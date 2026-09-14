"""
SmartFarm AI - Database Connection and Engine Management
Provides:
  - Centralized SQLAlchemy 2.x Engine with connection pooling
  - Safe database connectivity health checks with zero secret disclosure
"""

import logging
from typing import Optional, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.pool import QueuePool, StaticPool

from config import settings

logger = logging.getLogger("smartfarm.database")

_engine: Optional[Engine] = None


def get_engine() -> Optional[Engine]:
    """
    Returns the singleton SQLAlchemy Engine instance.
    Initializes lazily once using configured settings.
    """
    global _engine
    if _engine is not None:
        return _engine

    db_url = settings.sqlalchemy_database_url
    if not db_url:
        logger.info("DATABASE_URL is not configured. Database engine is not active.")
        return None

    try:
        connect_args = {}
        # Special case for SQLite (testing)
        if db_url.startswith("sqlite"):
            _engine = create_engine(
                db_url,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool
            )
        else:
            _engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                pool_timeout=settings.DB_POOL_TIMEOUT,
                connect_args=connect_args
            )
        logger.info(f"Initialized database engine for dialect: {_engine.dialect.name}")
        return _engine
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        return None


def check_database_connection(engine_instance: Optional[Engine] = None) -> Dict[str, Any]:
    """
    Safely tests database connectivity without exposing connection strings,
    passwords, usernames, or sensitive configuration.
    """
    eng = engine_instance or get_engine()
    is_configured = bool(settings.database_configured or engine_instance is not None)
    if not is_configured or eng is None:
        return {
            "configured": False,
            "connected": False,
            "status": "not_configured",
            "driver": None,
            "message": "Database URL is not configured."
        }

    try:
        with eng.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "configured": True,
            "connected": True,
            "status": "connected",
            "driver": eng.dialect.name,
            "message": "Database connection verified successfully."
        }
    except Exception as e:
        logger.warning(f"Database connection check failed: {e}")
        return {
            "configured": True,
            "connected": False,
            "status": "unavailable",
            "driver": eng.dialect.name,
            "message": "Configured database is currently unreachable."
        }
