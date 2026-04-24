import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import Base, engine
from routes import jobs, alerts
from services.scheduler import start_scheduler
import asyncio
from dotenv import load_dotenv

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Aggregator API")

import os

# Configure CORS for frontend
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL], # Restricted securely if defined in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")

@app.on_event("startup")
async def on_startup():
    print("Starting background scheduler...")
    start_scheduler()
    
    # We can also do an initial fetch if DB is empty
    from database.database import SessionLocal
    from services.job_service import fetch_jobs
    db = SessionLocal()
    existing_jobs = fetch_jobs(db, limit=1)
    db.close()
    
    if not existing_jobs:
        print("Database is empty. Triggering initial bulk seed of all job roles...")
        from services.api_service import fetch_jobs_from_api
        from services.job_service import save_jobs_bulk
        from services.scheduler import JOB_QUERIES
        
        async def initial_fetch():
            db = SessionLocal()
            try:
                for query in JOB_QUERIES:
                    jobs_data = await fetch_jobs_from_api(query)
                    added = save_jobs_bulk(db, jobs_data)
                    print(f"  Seeded '{query}' -> {added} jobs")
            finally:
                db.close()
            print("Initial bulk seed complete.")
        
        asyncio.create_task(initial_fetch())

@app.get("/")
def read_root():
    return {"message": "Welcome to the Job Aggregator API"}

if __name__ == "__main__":
    is_prod = os.getenv("ENV") == "production"
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=not is_prod)
