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
    walkin_keywords = [
        "walk-in", "walkin", "walk in", "drive", "mega drive", 
        "hiring drive", "recruitment drive", "immediate joiner",
        "direct interview", "interview drive"
    ]
    is_walkin = any(x in t_lower or x in description for x in walkin_keywords)
    
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
    pages: int = 2,
    location: str = "Hyderabad"
) -> List[JobCreate]:
    """Fetch jobs from multiple sources (Adzuna + Google Jobs via SerpApi)."""
    
    # 1. Fetch from Adzuna
    adzuna_jobs = await fetch_from_adzuna(query, realtime, pages, location)
    
    # 2. Fetch from Google Jobs (SerpApi)
    serp_jobs = await fetch_from_serpapi(query, location)
    
    # Combine and return
    return adzuna_jobs + serp_jobs


async def fetch_from_adzuna(query, realtime, pages, location) -> List[JobCreate]:
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    if not app_id or not app_key:
        logger.warning("ADZUNA credentials not found.")
        return []

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
        pages = 1

    all_jobs = []
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for page in range(1, pages + 1):
                response = await client.get(f"{base_url}/{page}", params=base_params)
                response.raise_for_status()
                data = response.json()
                results = data.get("results", [])
                for item in results:
                    job = _parse_job_item(item)
                    if job: all_jobs.append(job)
                if not results: break
    except Exception as e:
        logger.error(f"Adzuna error: {e}")
    return all_jobs


async def fetch_from_serpapi(query: str, location: str) -> List[JobCreate]:
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        logger.warning("SERPAPI_KEY not found. Skipping Google Jobs.")
        return []

    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_jobs",
        "q": f"{query} in {location}",
        "api_key": api_key,
        "hl": "en",
        "gl": "in"
    }

    all_jobs = []
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            logger.info(f"  Fetching Google Jobs (SerpApi) for '{query}'...")
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            jobs_results = data.get("jobs_results", [])
            for item in jobs_results:
                job = _parse_serpapi_item(item)
                if job:
                    all_jobs.append(job)
            logger.info(f"  Google Jobs: got {len(all_jobs)} results")
    except Exception as e:
        logger.error(f"SerpApi error: {e}")
    
    return all_jobs


def _parse_serpapi_item(item: dict) -> JobCreate | None:
    """Parse a Google Jobs result from SerpApi."""
    title = item.get("title", "Unknown Title")
    company = item.get("company_name", "Confidential")
    location = item.get("location", "Unknown")
    
    # Google Jobs usually provides multiple links, we take the first one
    apply_options = item.get("apply_options", [])
    apply_link = apply_options[0].get("link") if apply_options else None
    
    if not apply_link:
        return None

    # Walk-in Detection
    description = item.get("description", "").lower()
    t_lower = title.lower()
    walkin_keywords = ["walk-in", "walkin", "walk in", "drive", "mega drive", "immediate joiner"]
    is_walkin = any(x in t_lower or x in description for x in walkin_keywords)
    
    if is_walkin and "walk" not in t_lower:
        title = f"Walk-in: {title}"

    # Parse date (Google Jobs usually says "2 hours ago" etc.)
    # For simplicity, we use current time if not easily parsable
    return JobCreate(
        title=title,
        company=company,
        location=location,
        posted_date=datetime.utcnow(),
        apply_link=apply_link,
        source="Google Jobs"
    )

