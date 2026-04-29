from bs4 import BeautifulSoup
import re

with open('foundit_sample.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f, 'html.parser')

cards = soup.find_all('div', class_=re.compile('.*job-tittle.*|.*card-apply-content.*|.*srpResultCard.*|.*card.*'))
print(f"Found {len(cards)} potential card elements.")

# Let's just find anything with 'jobTitle' or 'companyName'
titles = soup.find_all(lambda tag: tag.name == "h3" or tag.name == "a" or (tag.has_attr("class") and any("title" in c.lower() for c in tag["class"])))
print("Titles:")
for t in titles[:10]:
    print(t.text.strip())
