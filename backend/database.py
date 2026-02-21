from sqlalchemy import create_engine, Column, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class TrainingJob(Base):
    __tablename__ = "training_jobs"

    task_id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    target_col = Column(String, nullable=False)
    problem_type = Column(String, nullable=True)  # "classification" | "regression"
    status = Column(String, default="pending")    # pending | running | done | error
    results = Column(Text, nullable=True)         # JSON blob
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


def create_tables():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
