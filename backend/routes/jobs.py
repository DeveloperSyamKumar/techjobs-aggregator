import logging
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from database.database import get_db
from schemas import job as schemas
from services import job_service, api_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/jobs", response_model=List[schemas.JobResponse])
def get_jobs(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    jobs = job_service.fetch_jobs(db, skip=skip, limit=limit)
    return jobs

@router.get("/companies", response_model=List[str])
def list_companies(db: Session = Depends(get_db)):
    """Return distinct company names available in the DB."""
    return job_service.get_distinct_companies(db)

@router.get("/filter", response_model=List[schemas.JobResponse])
async def filter_jobs(
    keyword: Optional[str] = None,
    location: Optional[str] = None,
    days_ago: Optional[int] = Query(None, description="Filter for last X days"),
    source: Optional[str] = None,
    company: Optional[str] = None,
    experience: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    # 1. Trigger Live Search if query params are present
    if keyword or location or company:
        search_term = keyword or company or "Software"
        search_location = location or "Hyderabad"
        
        logger.info(f"Live Search triggered: what='{search_term}', where='{search_location}'")
        
        # Fetch from Adzuna in real-time
        try:
            jobs_data = await api_service.fetch_jobs_from_api(
                query=search_term,
                location=search_location,
                realtime=False, # Get a broader set for manual search
                pages=1 # Fetch first 50 results for speed
            )
            if jobs_data:
                job_service.save_jobs_bulk(db, jobs_data)
        except Exception as e:
            logger.error(f"Live search failed: {e}")

    # 2. Query the DB (now populated with fresh live results)
    jobs = job_service.fetch_jobs(
        db, 
        keyword=keyword, 
        location=location, 
        days_ago=days_ago, 
        source=source,
        company=company,
        experience=experience,
        skip=skip, 
        limit=limit
    )
    
    return jobs


@router.post("/refresh")
async def trigger_job_refresh(db: Session = Depends(get_db)):
    """Manually trigger a job fetch from the API (Service Desk jobs only)."""
    from services.scheduler import JOB_QUERIES
    total_added = 0
    for query in JOB_QUERIES:
        jobs_data = await api_service.fetch_jobs_from_api(query=query)
        total_added += job_service.save_jobs_bulk(db, jobs_data)
    return {"message": f"Successfully fetched and added {total_added} new unique Service Desk jobs."}
