from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio
import logging
from database.database import SessionLocal
from services import api_service, job_service, alert_service

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# High-volume Hyderabad-specific IT roles
JOB_QUERIES = [
    "Software Engineer",
    "IT Walk-in",
    "Java Developer",
    "Python Developer",
    "Frontend Developer",
    "Data Analyst",
    "QA Tester",
    "Full Stack Developer",
    "Service Desk",
    "DevOps"
]

CYCLE_A = JOB_QUERIES
CYCLE_B = []  # unused but kept for compatibility

async def fetch_and_store_jobs_a():
    """Async Cycle A queries"""
    await _async_fetch(CYCLE_A)

async def fetch_and_store_jobs_b():
    """Async Cycle B queries"""
    await _async_fetch(CYCLE_B)

async def _async_fetch(queries: list):
    logger.info(f"Background Task: Fetching roles: {queries}")
    db = SessionLocal()
    total_added = 0
    try:
        for query in queries:
            # We pass realtime=True so we only fetch 1 page (newest 50 jobs)
            jobs_data = await api_service.fetch_jobs_from_api(query, realtime=True)
            newly_saved = []
            for job in jobs_data:
                created = job_service.create_job(db, job)
                if created:
                    newly_saved.append(created)
                    total_added += 1
            # Check newly saved jobs against all active alerts
            if newly_saved:
                alert_service.check_alerts_for_new_jobs(db, newly_saved)
            logger.info(f"  '{query}' -> {len(newly_saved)} new jobs saved")
        logger.info(f"Background Task Complete: {total_added} total new jobs added.")
    finally:
        db.close()

def start_scheduler():
    scheduler = AsyncIOScheduler()
    # Runs every 1 minute
    scheduler.add_job(fetch_and_store_jobs_a, 'interval', minutes=1)
    scheduler.start()
    return scheduler
