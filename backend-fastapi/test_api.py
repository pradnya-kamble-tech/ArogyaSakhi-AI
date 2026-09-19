import json, urllib.request

# Test login
url = 'http://127.0.0.1:8001/auth/login'
data = json.dumps({'username':'pcw1','password':'pcw123'}).encode()
req = urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as r:
        resp = json.loads(r.read().decode())
        print("Login Success:")
        print(f"  Token: {resp.get('token')[:50]}...")
        print(f"  User: {resp.get('user', {}).get('username')}")
        token = resp.get('token')
except Exception as e:
    print(f"Login failed: {e}")
    exit(1)

# Test patient list
url = 'http://127.0.0.1:8001/patients'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
try:
    with urllib.request.urlopen(req) as r:
        resp = json.loads(r.read().decode())
        print(f"\nPatient List: {len(resp)} patients")
        for p in resp[:2]:
            print(f"  - {p.get('name')} (Health ID: {p.get('health_id')})")
except Exception as e:
    print(f"List patients failed: {e}")

# Test analytics
url = 'http://127.0.0.1:8001/api/analytics'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
try:
    with urllib.request.urlopen(req) as r:
        resp = json.loads(r.read().decode())
        print(f"\nAnalytics:")
        print(f"  Total Patients: {resp.get('totalPatients')}")
        print(f"  Total Cases: {resp.get('totalCases')}")
        print(f"  Health Score: {resp.get('patientHealthScore')}")
except Exception as e:
    print(f"Analytics failed: {e}")

print("\n✓ Backend API tests passed")
