"""
SmartFarm AI - Database Session Management
Provides:
  - SessionLocal sessionmaker factory
  - get_db FastAPI dependency with automatic transaction commit/rollback
"""

import logging
from typing import Generator, Optional
from sqlalchemy.orm import sessionmaker, Session

from database.connection import get_engine

logger = logging.getLogger("smartfarm.database")

_SessionLocal: Optional[sessionmaker] = None


def get_session_factory() -> Optional[sessionmaker]:
    """Returns or creates the sessionmaker factory bound to the active engine."""
    global _SessionLocal
    if _SessionLocal is not None:
        return _SessionLocal

    engine = get_engine()
    if engine is None:
        return None

    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal


def get_db() -> Generator[Optional[Session], None, None]:
    """
    FastAPI dependency that provides a transactional database session per request.
    Automatically handles commit on success, rollback on exception, and session closure.
    Yields None if database is not configured.
    """
    factory = get_session_factory()
    if factory is None:
        yield None
        return

    session: Session = factory()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database transaction error, rolled back: {e}")
        raise
    finally:
        session.close()
