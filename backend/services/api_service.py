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
    """Parse a single SerpAPI job result into a JobCreate schema."""
    job_title = item.get("title", "Unknown Title")
    company = item.get("company_name", "Unknown Company")
    
    # 1. Skip aggregator lists (e.g., "1,504 Data analyst remote jobs in India")
    title_l = job_title.lower()
    if any(x in title_l for x in [" jobs in ", " jobs remote", " jobs - "]) and any(char.isdigit() for char in title_l[:4]):
        return None
        
    # 2. Clean up bad company names
    c_lower = company.lower()
    if c_lower.startswith("jobs via "):
        company = company[9:].strip()
    elif c_lower == "confidential":
        company = "Confidential"
    elif c_lower in ["google jobs", "linkedin", "naukri", "glassdoor", "indeed", "unknown company"]:
        # Attempt to extract from title
        if " at " in job_title:
            company = job_title.split(" at ")[-1].strip()
        elif " - " in job_title:
            company = job_title.split(" - ")[-1].strip()
        else:
            company = "Confidential"

    location = item.get("location", "Unknown")
    apply_link = None
    source_portal = "Google Jobs"

    apply_options = item.get("apply_options", [])
    if apply_options:
        apply_link = apply_options[0].get("link")
        source_portal = apply_options[0].get("title", "Google Jobs")

    if not apply_link:
        related = item.get("related_links", [])
        if related:
            apply_link = related[0].get("link")
            source_portal = related[0].get("text", "Google Jobs")

    if not apply_link:
        apply_link = "https://google.com/search?q=" + job_title.replace(" ", "+")

    # Parse posted_date from "X hours ago" / "X days ago"
    posted_date = datetime.utcnow()
    posted_str = item.get("detected_extensions", {}).get("posted_at", "")
    try:
        if "day" in posted_str:
            posted_date -= timedelta(days=int(posted_str.split()[0]))
        elif "hour" in posted_str:
            posted_date -= timedelta(hours=int(posted_str.split()[0]))
        elif "minute" in posted_str:
            posted_date -= timedelta(minutes=int(posted_str.split()[0]))
        elif "week" in posted_str:
            posted_date -= timedelta(weeks=int(posted_str.split()[0]))
        elif "month" in posted_str:
            posted_date -= timedelta(days=30 * int(posted_str.split()[0]))
    except Exception:
        pass

    return JobCreate(
        title=job_title,
        company=company,
        location=location,
        posted_date=posted_date,
        apply_link=apply_link,
        source=source_portal
    )


async def fetch_jobs_from_api(
    query: str = "QA Tester jobs India",
    realtime: bool = False,
    pages: int = 3  # fetch N pages * ~10 results = up to 30 jobs per query
) -> List[JobCreate]:
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key or api_key == "YOUR_SERPAPI_KEY":
        logger.warning("SERPAPI_KEY not found. Using MOCK data.")
        return [JobCreate(**job) for job in MOCK_JOBS]

    url = "https://serpapi.com/search.json"
    base_params = {
        "engine": "google_jobs",
        "q": query,
        "api_key": api_key,
        "hl": "en",
        "gl": "in",
    }
    if realtime:
        base_params["chips"] = "date_posted:today"
        pages = 1  # for realtime smart-cache, just first page is enough

    all_jobs: List[JobCreate] = []

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            for page in range(pages):
                start_offset = page * 10
                params = {**base_params, "start": start_offset}

                logger.info(f"  Fetching page {page + 1} (start={start_offset}) for '{query}'...")
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                results = data.get("jobs_results", [])
                if not results:
                    logger.info(f"  No more results at page {page + 1}, stopping.")
                    break  # stop paginating if no more results

                for item in results:
                    job = _parse_job_item(item)
                    if job:
                        all_jobs.append(job)

                logger.info(f"  Page {page + 1}: got {len(results)} results (total so far: {len(all_jobs)})")

    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Error fetching from SerpAPI for '{query}': {e}")
        if not all_jobs:
            return [JobCreate(**job) for job in MOCK_JOBS]

    return all_jobs
