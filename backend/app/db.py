from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from .config import settings

DATABASE_URL = settings.database_url or "postgresql+psycopg://app:app@localhost:5432/app"
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def db_ping() -> int:
    with engine.connect() as conn:
        return conn.execute(text("select 1")).scalar()
