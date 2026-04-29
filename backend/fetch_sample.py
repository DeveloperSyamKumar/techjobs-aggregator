import os
import json
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def fetch_sample():
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        print("No API key")
        return
    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_jobs",
        "q": "QA Tester",
        "api_key": api_key,
        "hl": "en",
        "gl": "in"
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        data = resp.json()
        with open("sample_serpapi.json", "w") as f:
            json.dump(data.get("jobs_results", []), f, indent=2)
        print("Saved to sample_serpapi.json")

asyncio.run(fetch_sample())
