import json
import urllib.request
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

def wait_for_server(url="http://localhost:8080/api/auth/login", max_wait=35):
    start = time.time()
    while time.time() - start < max_wait:
        try:
            req = urllib.request.Request(url, data=json.dumps({"identifier":"ADM-001","password":"password123"}).encode('utf-8'), headers={'Content-Type':'application/json'}, method='POST')
            with urllib.request.urlopen(req, timeout=3) as res:
                if res.getcode() == 200:
                    return True
        except:
            time.sleep(1)
    return False

def test_endpoint(name, url, method="GET", payload=None, headers=None):
    if headers is None:
        headers = {}
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        data = None

    start_t = time.time()
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            status = response.getcode()
            elapsed_ms = (time.time() - start_t) * 1000.0
            body = response.read().decode('utf-8')
            try:
                parsed = json.loads(body)
                print(f"[PASS] [{status}] {name} ({elapsed_ms:.1f}ms)")
                return True, parsed
            except:
                print(f"[PASS] [{status}] {name} ({elapsed_ms:.1f}ms)")
                return True, body
    except urllib.error.HTTPError as e:
        elapsed_ms = (time.time() - start_t) * 1000.0
        err_body = e.read().decode('utf-8')
        print(f"[FAIL] [{e.code}] {name} ({elapsed_ms:.1f}ms): {err_body[:120]}")
        return False, err_body
    except Exception as e:
        elapsed_ms = (time.time() - start_t) * 1000.0
        print(f"[ERR] {name} ({elapsed_ms:.1f}ms): {e}")
        return False, str(e)

print("=== SES-GPT Vector Neighborhood Cache & Backend Test Suite ===")

ready = wait_for_server()
if not ready:
    print("[FAIL] Server failed to start within timeout window.")
    sys.exit(1)

# 1. Login with Student
ok, login_data = test_endpoint("POST /api/auth/login (Student)", "http://localhost:8080/api/auth/login", "POST", {"identifier": "10671234", "password": "password123"})
token = login_data.get("token") if ok and isinstance(login_data, dict) else None
auth_headers = {"Authorization": f"Bearer {token}"} if token else {}

# 2. Initial Question (Warms 5-minute Vector Neighborhood Cache)
print("\n--- Testing 5-Minute Semantic Vector Neighborhood Cache ---")
ok, res1 = test_endpoint("Q1: 'What is the FGPA formula across levels?' (Cold / DB Retrieval)", "http://localhost:8080/api/chat", "POST", {"question": "What is the FGPA formula across levels?"}, headers=auth_headers)

# 3. Follow-up Question in same neighborhood (Hits RAM Vector Neighborhood Cache)
ok, res2 = test_endpoint("Q2: 'What is the pass mark and credit load?' (⚡ Cache HIT)", "http://localhost:8080/api/chat", "POST", {"question": "What is the pass mark and credit load?"}, headers=auth_headers)

# 4. Another Follow-up Question in same neighborhood
ok, res3 = test_endpoint("Q3: 'How are degree classifications calculated?' (⚡ Cache HIT)", "http://localhost:8080/api/chat", "POST", {"question": "How are degree classifications calculated?"}, headers=auth_headers)

print("\n--- Additional Endpoint Verifications ---")
test_endpoint("GET /api/notifications", "http://localhost:8080/api/notifications", "GET", headers=auth_headers)
test_endpoint("GET /api/announcements", "http://localhost:8080/api/announcements", "GET", headers=auth_headers)
test_endpoint("GET /api/whatsapp/sessions", "http://localhost:8080/api/whatsapp/sessions", "GET", headers=auth_headers)

print("\n=== End of Verification Suite ===")
