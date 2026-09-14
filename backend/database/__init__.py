"""
SmartFarm AI - Database Package
Exposes core ORM models, session factories, and health checks.
"""

from database.base import Base
from database.connection import get_engine, check_database_connection
from database.session import get_session_factory, get_db
from database.models import (
    User,
    FieldRecord,
    DiseasePredictionRecord,
    AiReportRecord
)

__all__ = [
    "Base",
    "get_engine",
    "get_session_factory",
    "get_db",
    "check_database_connection",
    "User",
    "FieldRecord",
    "DiseasePredictionRecord",
    "AiReportRecord",
]
