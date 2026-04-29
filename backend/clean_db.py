import sqlite3

conn = sqlite3.connect('jobs.db')
c = conn.cursor()

# Delete aggregator lists
c.execute("DELETE FROM jobs WHERE (title LIKE '% jobs in %' OR title LIKE '% jobs remote%' OR title LIKE '% jobs - %') AND (title LIKE '0%' OR title LIKE '1%' OR title LIKE '2%' OR title LIKE '3%' OR title LIKE '4%' OR title LIKE '5%' OR title LIKE '6%' OR title LIKE '7%' OR title LIKE '8%' OR title LIKE '9%')")
print(f"Deleted {c.rowcount} aggregator lists")

# Clean 'Jobs via X'
c.execute("UPDATE jobs SET company = SUBSTR(company, 10) WHERE company LIKE 'Jobs via %' OR company LIKE 'jobs via %'")
print(f"Cleaned 'Jobs via...' {c.rowcount} times")

# Clean 'confidential'
c.execute("UPDATE jobs SET company = 'Confidential' WHERE company = 'confidential'")
print(f"Cleaned 'confidential' {c.rowcount} times")

# Clean Google Jobs / LinkedIn / Naukri -> Extract from title or set to Confidential
c.execute("SELECT id, title, company FROM jobs WHERE company IN ('Google Jobs', 'LinkedIn', 'Naukri', 'Glassdoor', 'Indeed', 'Unknown Company')")
rows = c.fetchall()
cleaned = 0
for row in rows:
    job_id, title, company = row
    new_company = "Confidential"
    if " at " in title:
        new_company = title.split(" at ")[-1].strip()
    elif " - " in title:
        new_company = title.split(" - ")[-1].strip()
    c.execute("UPDATE jobs SET company = ? WHERE id = ?", (new_company, job_id))
    cleaned += 1

print(f"Cleaned {cleaned} generic platform company names")

conn.commit()
conn.close()
