import httpx, json
base='http://127.0.0.1:8001'
client=httpx.Client()
res=client.post(base+'/auth/login', json={'username':'admin','password':'admin123'}, timeout=10)
print('login', res.status_code)
if res.status_code!=200:
    print(res.text); raise SystemExit(1)
token=res.json().get('token')
headers={'Authorization':f'Bearer {token}'}
endpoints=['/api/analytics','/api/patients','/api/alerts','/api/notifications']
for e in endpoints:
    r=client.get(base+e, headers=headers, timeout=10)
    print('\nGET', e, r.status_code)
    try:
        print(json.dumps(r.json(), indent=2)[:1000])
    except Exception as ex:
        print('non-json response or error:', ex, r.text[:1000])
