import httpx
from bs4 import BeautifulSoup
import json

def fetch_foundit():
    url = "https://www.foundit.in/srp/results?query=software%20developer&locations=Hyderabad"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    resp = httpx.get(url, headers=headers, follow_redirects=True)
    soup = BeautifulSoup(resp.text, 'html.parser')
    
    # We need to find the job cards
    jobs = []
    # Try finding typical job card classes
    cards = soup.select(".card-apply-content") # Common in foundit
    if not cards:
        cards = soup.select(".job-tittle") # Let's just try to find elements that look like jobs
    
    # Actually, Foundit might use a Next.js or Nuxt.js hydration script, let's check for JSON in script tags
    script_tag = soup.find('script', id='__NEXT_DATA__')
    if script_tag:
        data = json.loads(script_tag.string)
        with open("foundit_data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print("Saved Next.js JSON data")
        return

    # If no __NEXT_DATA__, just save a snippet of HTML to examine
    with open("foundit_sample.html", "w", encoding="utf-8") as f:
        f.write(soup.prettify()[:10000])
    print("Saved HTML sample")

fetch_foundit()
