from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint, Boolean
from database.database import Base
from datetime import datetime

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    company = Column(String, index=True, nullable=False)
    location = Column(String, index=True, nullable=True)
    posted_date = Column(DateTime, default=datetime.utcnow)
    apply_link = Column(String, nullable=True)
    source = Column(String, index=True, nullable=False)

    __table_args__ = (
        UniqueConstraint('title', 'company', 'apply_link', name='uix_job_dedupe'),
    )


class JobAlert(Base):
    __tablename__ = "job_alerts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)              # User-defined label
    keyword = Column(String, nullable=True)
    location = Column(String, nullable=True)
    company = Column(String, nullable=True)
    source = Column(String, nullable=True)
    days_ago = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    match_count = Column(Integer, default=0)           # Unread new-job matches
    created_at = Column(DateTime, default=datetime.utcnow)
    last_triggered_at = Column(DateTime, nullable=True)
