#!/usr/bin/env python3
"""Diagnóstico rápido da API DOC 2.0 do GDELT: quais formatos de consulta ela aceita."""
import time
import requests

URL = "https://api.gdeltproject.org/api/v2/doc/doc"
CONSULTAS = [
    "sourcecountry:IR",
    "sourcecountry:iran",
    "sourcecountry:IR theme:ARMEDCONFLICT",
    "sourcecountry:IR (theme:ARMEDCONFLICT OR theme:MILITARY)",
    "sourcecountry:IR (theme:ARMEDCONFLICT OR theme:MILITARY OR theme:ELECTION OR theme:SANCTIONS OR theme:TERROR OR theme:PROTEST)",
    "sourcecountry:IR (theme:ARMEDCONFLICT OR theme:MILITARY OR theme:ELECTION OR theme:SANCTIONS OR theme:TERROR OR theme:PROTEST OR theme:NEGOTIATIONS OR theme:CEASEFIRE OR theme:PEACEKEEPING OR theme:REBELLION OR theme:LEADER OR theme:GENERAL_GOVERNMENT)",
    "sourcecountry:IR (government OR minister OR president OR military OR war OR election)",
    "sourcecountry:GM (government OR minister OR president OR military OR war OR election)",
    "sourcecountry:US (government OR minister OR president OR military OR war OR election)",
    "(sourcecountry:WE OR sourcecountry:GZ) (government OR military OR war)",
]
for q in CONSULTAS:
    for tentativa in range(3):
        time.sleep(12 if tentativa == 0 else 30)
        try:
            r = requests.get(URL, params={"query": q, "mode": "artlist", "format": "json", "maxrecords": 75,
                                          "timespan": "24h", "sort": "datedesc"},
                             headers={"User-Agent": "mapa-raccoon-mundi-diagnostico/1.0", "Connection": "close"},
                             timeout=60)
        except requests.RequestException as e:
            print(f"[rede] {q[:70]} -> {e}")
            continue
        t = r.text.strip()
        if "limit requests" in t.lower():
            print(f"[espera] {q[:70]}")
            continue
        if t.startswith("{"):
            import json
            arts = json.loads(t, strict=False).get("articles") or []
            langs = sorted({a.get('language') for a in arts})
            print(f"[OK {len(arts):3d}] {q}\n         idiomas={langs[:6]} exemplo={arts[0]['title'][:80] if arts else '-'}")
        else:
            print(f"[{r.status_code} texto] {q}\n         -> {t[:150]}")
        break
