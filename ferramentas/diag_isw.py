"""Diagnóstico: API pública do DeepStateMap (linha de frente atual na Ucrânia)."""
import requests, json
s = requests.Session(); s.headers["User-Agent"] = "Mozilla/5.0 (mapa-raccoon-mundi)"
for url in ["https://deepstatemap.live/api/history/last", "https://deepstatemap.live/api/history/public",
            "https://deepstatemap.live/api/history/last/geojson"]:
    try:
        r = s.get(url, timeout=60)
        print("URL", url, r.status_code, r.headers.get("content-type"), len(r.content))
        try:
            d = r.json()
        except Exception:
            print("   texto:", r.text[:200]); continue
        if isinstance(d, list):
            print("   lista", len(d), json.dumps(d[-2:])[:400])
        else:
            print("   chaves", list(d)[:15])
            m = d.get("map") or d
            if isinstance(m, dict) and m.get("features"):
                fs = m["features"]
                print("   feições", len(fs))
                from collections import Counter
                print("   nomes", Counter((f.get("properties") or {}).get("name", "")[:60] for f in fs).most_common(12))
                print("   tipos", Counter(f["geometry"]["type"] for f in fs))
            print("   datas", {k: d[k] for k in d if k in ("id", "datetime", "createdAt", "updatedAt", "date")})
    except Exception as e:
        print("URL", url, "erro", e)
