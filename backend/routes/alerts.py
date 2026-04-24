from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from schemas import alert as schemas
from schemas import job as job_schemas
from services import alert_service

router = APIRouter()


@router.get("/alerts", response_model=List[schemas.AlertResponse])
def list_alerts(db: Session = Depends(get_db)):
    """Return all saved alerts ordered by newest first."""
    return alert_service.get_alerts(db)


@router.post("/alerts", response_model=schemas.AlertResponse, status_code=201)
def create_alert(alert_data: schemas.AlertCreate, db: Session = Depends(get_db)):
    """Create a new job alert."""
    return alert_service.create_alert(db, alert_data)


@router.delete("/alerts/{alert_id}", status_code=204)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    """Delete a job alert by ID."""
    success = alert_service.delete_alert(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")


@router.patch("/alerts/{alert_id}/toggle", response_model=schemas.AlertResponse)
def toggle_alert(alert_id: int, db: Session = Depends(get_db)):
    """Enable or disable a job alert."""
    alert = alert_service.toggle_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/alerts/{alert_id}/read", response_model=schemas.AlertResponse)
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    """Reset the unread match count for an alert."""
    alert = alert_service.mark_alert_read(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.get("/alerts/{alert_id}/matches", response_model=List[job_schemas.JobResponse])
def get_alert_matches(alert_id: int, db: Session = Depends(get_db)):
    """Return jobs from the DB matching this alert's filter criteria."""
    alert = alert_service.get_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert_service.get_alert_matches(db, alert_id)


@router.get("/alerts-count")
def get_unread_count(db: Session = Depends(get_db)):
    """Return total unread match count across all active alerts (for the Navbar badge)."""
    count = alert_service.get_total_unread_count(db)
    return {"count": count}
