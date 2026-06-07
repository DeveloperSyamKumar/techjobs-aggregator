from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, timedelta

from database import models
from schemas import job as schemas

def get_job_by_id(db: Session, job_id: int):
    return db.query(models.Job).filter(models.Job.id == job_id).first()

def create_job(db: Session, job_data: schemas.JobCreate):
    db_job = models.Job(**job_data.model_dump())
    db.add(db_job)
    try:
        db.commit()
        db.refresh(db_job)
        return db_job
    except IntegrityError:
        # Avoid duplicate jobs based on unique constraint
        db.rollback()
        return None

def get_distinct_companies(db: Session) -> list:
    """Return sorted list of unique company names in the DB."""
    rows = (
        db.query(models.Job.company)
        .filter(models.Job.company.isnot(None), models.Job.company != "")
        .distinct()
        .order_by(models.Job.company)
        .all()
    )
    return [r[0] for r in rows]

def fetch_jobs(
    db: Session,
    keyword: Optional[str] = None,
    location: Optional[str] = None,
    days_ago: Optional[int] = None,
    source: Optional[str] = None,
    company: Optional[str] = None,
    experience: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = db.query(models.Job)

    if keyword:
        # simple case-insensitive search
        query = query.filter(models.Job.title.ilike(f"%{keyword}%") | models.Job.company.ilike(f"%{keyword}%"))
    if location:
        loc_lower = location.lower()
        if "bengaluru" in loc_lower or "bangalore" in loc_lower:
            query = query.filter(models.Job.location.ilike("%bengaluru%") | models.Job.location.ilike("%bangalore%"))
        elif "gurugram" in loc_lower or "gurgaon" in loc_lower:
            query = query.filter(models.Job.location.ilike("%gurugram%") | models.Job.location.ilike("%gurgaon%"))
        else:
            query = query.filter(models.Job.location.ilike(f"%{location}%"))
    if source:
        query = query.filter(models.Job.source.ilike(f"%{source}%"))
    if company:
        query = query.filter(models.Job.company.ilike(f"%{company}%"))
    if experience:
        if experience == "5+":
            # Match single digits 5-9 and common double digit patterns
            query = query.filter(
                models.Job.experience.ilike("5+%") | 
                models.Job.experience.ilike("6+%") | 
                models.Job.experience.ilike("7+%") | 
                models.Job.experience.ilike("8+%") | 
                models.Job.experience.ilike("9+%") |
                models.Job.experience.ilike("5-%") | 
                models.Job.experience.ilike("6-%") | 
                models.Job.experience.ilike("7-%") | 
                models.Job.experience.ilike("8-%") | 
                models.Job.experience.ilike("9-%") |
                models.Job.experience.ilike("10%") |
                models.Job.experience.ilike("11%") |
                models.Job.experience.ilike("12%") |
                models.Job.experience.ilike("13%") |
                models.Job.experience.ilike("14%") |
                models.Job.experience.ilike("15%") |
                models.Job.experience.ilike("20%") |
                models.Job.experience.ilike("25%")
            )
        elif experience == "0-1":
            query = query.filter(models.Job.experience.ilike("%0-1%") | models.Job.experience.ilike("%fresher%"))
        elif experience == "1-3":
            query = query.filter(
                models.Job.experience.ilike("%1-2%") | 
                models.Job.experience.ilike("%1-3%") | 
                models.Job.experience.ilike("%2-3%") |
                models.Job.experience.ilike("1+%") |
                models.Job.experience.ilike("2+%")
            )
        elif experience == "3-5":
            query = query.filter(
                models.Job.experience.ilike("%3-4%") | 
                models.Job.experience.ilike("%3-5%") | 
                models.Job.experience.ilike("%4-5%") |
                models.Job.experience.ilike("3+%") |
                models.Job.experience.ilike("4+%")
            )
        else:
            query = query.filter(models.Job.experience.ilike(f"%{experience}%"))
    if days_ago:
        date_threshold = datetime.utcnow() - timedelta(days=days_ago)
        query = query.filter(models.Job.posted_date >= date_threshold)

    query = query.order_by(models.Job.posted_date.desc())
    return query.offset(skip).limit(limit).all()

def save_jobs_bulk(db: Session, jobs: List[schemas.JobCreate]):
    added_count = 0
    for job in jobs:
        created = create_job(db, job)
        if created:
            added_count += 1
    return added_count
