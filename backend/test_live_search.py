import httpx
import json

def test_filter():
    url = "http://localhost:8000/api/filter"
    params = {
        "keyword": "Data Scientist",
        "location": "Hyderabad"
    }
    try:
        print(f"Testing live search for {params}...")
        resp = httpx.get(url, params=params, timeout=30.0)
        print(f"Status Code: {resp.status_code}")
        data = resp.json()
        print(f"Number of jobs returned: {len(data)}")
        if data:
            print(f"First job: {data[0]['title']} at {data[0]['company']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_filter()
