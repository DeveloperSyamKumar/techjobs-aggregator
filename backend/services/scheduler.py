from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio
import logging
from database.database import SessionLocal
from services import api_service, job_service, alert_service

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Service Desk job roles across India
JOB_QUERIES = [
    "Service Desk jobs India",
    "Service Desk Analyst India",
    "IT Service Desk Engineer India",
    "Help Desk Support jobs India",
    "Software Engineer jobs India",
    "Data Analyst jobs India",
    "QA Tester jobs India",
    "HR Recruiter jobs India",
    "Customer Support jobs India",
    "Walk-in jobs India",
]

# With only 4 queries we no longer need to split into cycles — run all together
CYCLE_A = JOB_QUERIES
CYCLE_B = []  # unused but kept for compatibility

def fetch_and_store_jobs_a():
    """Synchronous wrapper — Cycle A queries"""
    asyncio.create_task(_async_fetch(CYCLE_A))

def fetch_and_store_jobs_b():
    """Synchronous wrapper — Cycle B queries"""
    asyncio.create_task(_async_fetch(CYCLE_B))

async def _async_fetch(queries: list):
    logger.info(f"Background Task: Fetching roles: {[q.split(' ')[0] for q in queries]}")
    db = SessionLocal()
    total_added = 0
    try:
        for query in queries:
            jobs_data = await api_service.fetch_jobs_from_api(query)
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
    # Cycle A runs every 12 hrs — at startup offset 0
    scheduler.add_job(fetch_and_store_jobs_a, 'interval', hours=12)
    # Cycle B runs every 12 hrs — offset by 6 hours so both together = 6hr refresh rhythm
    scheduler.add_job(fetch_and_store_jobs_b, 'interval', hours=12, minutes=0,
                      start_date='2026-01-01 06:00:00')
    scheduler.start()
    return scheduler
