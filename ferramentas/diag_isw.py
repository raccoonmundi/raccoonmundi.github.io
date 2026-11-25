"""Diagnóstico: encontra no ArcGIS do ISW/CTP a camada de território sob controle russo na Ucrânia."""
import requests, json, datetime as dt
BASE = "https://services5.arcgis.com/SaBe5HMtmnbqSWlu/ArcGIS/rest/services"
s = requests.Session(); s.headers["User-Agent"] = "mapa-raccoon-mundi/1.0"
d = s.get(BASE, params={"f": "json"}, timeout=60).json()
servs = d.get("services", [])
print("serviços:", len(servs))
chaves = ["control", "russia", "occup", "terrain", "cot", "ukrain", "assess", "rcu", "front"]
cand = [x for x in servs if any(k in x["name"].lower() for k in chaves)]
for x in cand:
    print("SERV", x["name"], x["type"])
for x in cand[:60]:
    try:
        info = s.get(f"{BASE}/{x['name']}/{x['type']}", params={"f": "json"}, timeout=60).json()
    except Exception as e:
        print("  erro", e); continue
    ed = (info.get("editingInfo") or {}).get("lastEditDate")
    quando = dt.datetime.utcfromtimestamp(ed / 1000).strftime("%Y-%m-%d") if ed else "?"
    for ly in info.get("layers", []):
        print(f"  [{quando}] {x['name']} / {ly['id']}: {ly['name']}")
