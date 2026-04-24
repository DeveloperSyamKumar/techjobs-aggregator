from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from database.database import get_db
from schemas import job as schemas
from services import job_service, api_service

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
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    jobs = job_service.fetch_jobs(
        db, 
        keyword=keyword, 
        location=location, 
        days_ago=days_ago, 
        source=source,
        company=company,
        skip=skip, 
        limit=limit
    )
    
    # Smart Cache Pipeline: If database yields 0 results, dynamically fetch and ingest!
    if not jobs and (keyword or company):
        # Build a meaningful search query from whatever the user provided
        search_term = keyword or company
        query_str = f"{search_term} jobs India"
        if location:
            query_str += f" {location}"

        # For company searches: fetch multiple pages without today-only restriction
        # so we get a broad set of jobs (company names from API may differ from user input)
        jobs_data = await api_service.fetch_jobs_from_api(
            query=query_str,
            realtime=False,  # don't restrict to today — get more results
            pages=3
        )
        if jobs_data:
            job_service.save_jobs_bulk(db, jobs_data)
            # Re-query: search keyword field (title + company) so variations like
            # "Tata Consultancy Services" are found when user typed "tcs"
            jobs = job_service.fetch_jobs(
                db,
                keyword=search_term,   # broader match across title AND company
                location=location,
                days_ago=days_ago,
                source=source,
                skip=skip,
                limit=limit
            )
            # If keyword-based re-query also finds nothing, fall back to company filter
            if not jobs and company:
                jobs = job_service.fetch_jobs(
                    db,
                    company=company,
                    location=location,
                    days_ago=days_ago,
                    source=source,
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
