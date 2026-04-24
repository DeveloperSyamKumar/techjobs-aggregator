from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, timedelta

from database import models
from schemas import alert as schemas


# ── CRUD ────────────────────────────────────────────────────────────────────

def create_alert(db: Session, alert_data: schemas.AlertCreate) -> models.JobAlert:
    alert = models.JobAlert(**alert_data.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def get_alerts(db: Session) -> List[models.JobAlert]:
    return db.query(models.JobAlert).order_by(models.JobAlert.created_at.desc()).all()


def get_alert(db: Session, alert_id: int) -> Optional[models.JobAlert]:
    return db.query(models.JobAlert).filter(models.JobAlert.id == alert_id).first()


def delete_alert(db: Session, alert_id: int) -> bool:
    alert = get_alert(db, alert_id)
    if not alert:
        return False
    db.delete(alert)
    db.commit()
    return True


def toggle_alert(db: Session, alert_id: int) -> Optional[models.JobAlert]:
    alert = get_alert(db, alert_id)
    if not alert:
        return None
    alert.is_active = not alert.is_active
    db.commit()
    db.refresh(alert)
    return alert


def mark_alert_read(db: Session, alert_id: int) -> Optional[models.JobAlert]:
    """Reset match_count to 0 — user has seen the matches."""
    alert = get_alert(db, alert_id)
    if not alert:
        return None
    alert.match_count = 0
    db.commit()
    db.refresh(alert)
    return alert


def get_total_unread_count(db: Session) -> int:
    """Sum of match_count across all active alerts — used for navbar badge."""
    alerts = db.query(models.JobAlert).filter(
        models.JobAlert.is_active == True,
        models.JobAlert.match_count > 0
    ).all()
    return sum(a.match_count for a in alerts)


# ── Matching ─────────────────────────────────────────────────────────────────

def _job_matches_alert(job: models.Job, alert: models.JobAlert) -> bool:
    """Check whether a single job satisfies an alert's filter criteria."""
    if alert.keyword:
        kw = alert.keyword.lower()
        title = (job.title or "").lower()
        company = (job.company or "").lower()
        if kw not in title and kw not in company:
            return False

    if alert.location:
        loc = (job.location or "").lower()
        if alert.location.lower() not in loc:
            return False

    if alert.company:
        comp = (job.company or "").lower()
        if alert.company.lower() not in comp:
            return False

    if alert.source:
        src = (job.source or "").lower()
        if alert.source.lower() not in src:
            return False

    if alert.days_ago:
        cutoff = datetime.utcnow() - timedelta(days=alert.days_ago)
        if job.posted_date and job.posted_date < cutoff:
            return False

    return True


def check_alerts_for_new_jobs(db: Session, new_jobs: List[models.Job]):
    """
    Called by the scheduler after saving new jobs.
    Increments match_count for each active alert whose criteria match any new job.
    """
    if not new_jobs:
        return

    active_alerts = db.query(models.JobAlert).filter(
        models.JobAlert.is_active == True
    ).all()

    for alert in active_alerts:
        matched = sum(1 for job in new_jobs if _job_matches_alert(job, alert))
        if matched:
            alert.match_count += matched
            alert.last_triggered_at = datetime.utcnow()

    db.commit()


def get_alert_matches(db: Session, alert_id: int, limit: int = 50) -> List[models.Job]:
    """Return jobs from the DB that match this alert's filter criteria."""
    alert = get_alert(db, alert_id)
    if not alert:
        return []

    query = db.query(models.Job)

    if alert.keyword:
        query = query.filter(
            models.Job.title.ilike(f"%{alert.keyword}%") |
            models.Job.company.ilike(f"%{alert.keyword}%")
        )
    if alert.location:
        query = query.filter(models.Job.location.ilike(f"%{alert.location}%"))
    if alert.company:
        query = query.filter(models.Job.company.ilike(f"%{alert.company}%"))
    if alert.source:
        query = query.filter(models.Job.source.ilike(f"%{alert.source}%"))
    if alert.days_ago:
        cutoff = datetime.utcnow() - timedelta(days=alert.days_ago)
        query = query.filter(models.Job.posted_date >= cutoff)

    return query.order_by(models.Job.posted_date.desc()).limit(limit).all()
