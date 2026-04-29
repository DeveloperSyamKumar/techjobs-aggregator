import sqlite3
import pprint

conn = sqlite3.connect('jobs.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()

c.execute("SELECT company, title, source FROM jobs WHERE company IN ('Google Jobs', 'LinkedIn', 'Naukri', 'Unknown Company') OR company LIKE '%jobs%' LIMIT 10")
rows = c.fetchall()

for r in rows:
    print(dict(r))
