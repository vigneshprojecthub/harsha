from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import settings

# Neon (and most cloud Postgres) requires SSL
# If the URL already has ?sslmode=require that's fine; this adds it if missing
db_url = settings.DATABASE_URL

# Ensure SSL for non-local connections
connect_args = {}
if "localhost" not in db_url and "127.0.0.1" not in db_url:
    connect_args["sslmode"] = "require"

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,        # test connection before use (handles Neon auto-pause)
    pool_recycle=300,          # recycle connections every 5 min
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Returns True if DB is reachable."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
