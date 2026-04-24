import os
import httpx
import logging
from datetime import datetime, timedelta
from typing import List
from schemas.job import JobCreate

logger = logging.getLogger(__name__)

# Fallback mock data when no API key is present
MOCK_JOBS = [
    {
        "title": "QA Tester",
        "company": "Tech Mahindra",
        "location": "Hyderabad, Telangana",
        "posted_date": datetime.utcnow() - timedelta(hours=2),
        "apply_link": "https://www.linkedin.com/jobs/search/?keywords=QA+Tester",
        "source": "LinkedIn"
    },
    {
        "title": "Software Testing Engineer",
        "company": "TCS",
        "location": "Hyderabad, Telangana",
        "posted_date": datetime.utcnow() - timedelta(days=1),
        "apply_link": "https://www.naukri.com/software-testing-engineer-jobs",
        "source": "Naukri"
    },
    {
        "title": "Senior QA Automation",
        "company": "Infosys",
        "location": "Remote",
        "posted_date": datetime.utcnow() - timedelta(hours=5),
        "apply_link": "https://www.google.com/about/careers/applications/jobs/results/?q=QA",
        "source": "Google Jobs"
    },
    {
        "title": "Software Test Engineer - Freshers",
        "company": "Wipro",
        "location": "Hyderabad, Telangana",
        "posted_date": datetime.utcnow() - timedelta(days=3),
        "apply_link": "https://www.linkedin.com/jobs/search/?keywords=Software+Test+Engineer",
        "source": "LinkedIn"
    },
    {
        "title": "Manual Tester",
        "company": "Capgemini",
        "location": "Pune, Maharashtra",
        "posted_date": datetime.utcnow() - timedelta(minutes=30),
        "apply_link": "https://www.naukri.com/manual-tester-jobs",
        "source": "Naukri"
    }
]


def _parse_job_item(item: dict) -> JobCreate | None:
    """Parse a single Adzuna job result into a JobCreate schema."""
    job_title = item.get("title", "Unknown Title")
    company_data = item.get("company", {})
    company = company_data.get("display_name", "Confidential")
    
    location_data = item.get("location", {})
    location = location_data.get("display_name", "Unknown")
    
    apply_link = item.get("redirect_url")
    if not apply_link:
        return None  # Skip if no link
        
    source_portal = "Adzuna"

    # Enhanced Walk-in Detection: Check title and description
    description = item.get("description", "").lower()
    t_lower = job_title.lower()
    is_walkin = any(x in t_lower or x in description for x in ["walk-in", "walkin", "walk in", "drive"])
    
    if is_walkin and "walk" not in t_lower:
        job_title = f"Walk-in: {job_title}"

    # Parse posted_date from "2026-04-03T06:28:55Z"
    posted_str = item.get("created", "")
    try:
        if posted_str.endswith('Z'):
            posted_str = posted_str[:-1]
        posted_date = datetime.fromisoformat(posted_str)
    except Exception:
        posted_date = datetime.utcnow()

    return JobCreate(
        title=job_title,
        company=company,
        location=location,
        posted_date=posted_date,
        apply_link=apply_link,
        source=source_portal
    )


async def fetch_jobs_from_api(
    query: str = "Software Developer",
    realtime: bool = False,
    pages: int = 2,  # fetch N pages * 50 results = up to 100 jobs per query
    location: str = "Hyderabad"
) -> List[JobCreate]:
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    if not app_id or not app_key:
        logger.warning("ADZUNA credentials not found. Using MOCK data.")
        return [JobCreate(**job) for job in MOCK_JOBS]

    base_url = "https://api.adzuna.com/v1/api/jobs/in/search"
    base_params = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": 50,
        "where": location,
        "what": query,
        "sort_by": "date" if realtime else "relevance"
    }
    
    if realtime:
        pages = 1  # When fetching every minute, 1 page of 50 is enough

    all_jobs: List[JobCreate] = []

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for page in range(1, pages + 1):
                logger.info(f"  Fetching Adzuna page {page} for '{query}'...")
                response = await client.get(f"{base_url}/{page}", params=base_params)
                response.raise_for_status()
                data = response.json()

                results = data.get("results", [])
                if not results:
                    logger.info(f"  No more results at page {page}, stopping.")
                    break

                for item in results:
                    job = _parse_job_item(item)
                    if job:
                        all_jobs.append(job)

                logger.info(f"  Page {page}: got {len(results)} results (total so far: {len(all_jobs)})")

    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Error fetching from Adzuna API for '{query}': {e}")
        if not all_jobs:
            return [JobCreate(**job) for job in MOCK_JOBS]

    return all_jobs

