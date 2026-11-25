"""Diagnóstico: datas, campos e tamanho das camadas candidatas do ISW/CTP."""
import requests, datetime as dt
BASE = "https://services5.arcgis.com/SaBe5HMtmnbqSWlu/ArcGIS/rest/services"
s = requests.Session(); s.headers["User-Agent"] = "mapa-raccoon-mundi/1.0"
def data(ms): return dt.datetime.utcfromtimestamp(ms / 1000).strftime("%Y-%m-%d %H:%M") if ms else "?"
for nome in ["Russian_Controlled_Ukrainian_Territory", "AssessedRussianAdvanceInUkraine_V2_view",
             "MDS_AssessedRussianAdvanceInUkraine_view", "COT_Merge_Jan_2026_view", "UkraineCoTTimelapse_Full_Length_view",
             "AssessedIsraeliControlledTerritory_VIEW", "Assessed_Israeli_Advances_VIEW"]:
    try:
        srv = s.get(f"{BASE}/{nome}/FeatureServer", params={"f": "json"}, timeout=60).json()
        for ly in srv.get("layers", [])[:3]:
            info = s.get(f"{BASE}/{nome}/FeatureServer/{ly['id']}", params={"f": "json"}, timeout=60).json()
            ed = info.get("editingInfo") or {}
            cont = s.get(f"{BASE}/{nome}/FeatureServer/{ly['id']}/query", params={"where": "1=1", "returnCountOnly": "true", "f": "json"}, timeout=60).json()
            campos = [f["name"] for f in info.get("fields", [])][:12]
            gj = s.get(f"{BASE}/{nome}/FeatureServer/{ly['id']}/query", params={"where": "1=1", "outFields": "*", "f": "geojson", "outSR": 4326, "geometryPrecision": 3, "maxAllowableOffset": 0.01}, timeout=120)
            tam = len(gj.content)
            props = (gj.json().get("features") or [{}])[0].get("properties") if gj.ok else None
            print(f"{nome}/{ly['id']} '{ly['name']}': editado {data(ed.get('lastEditDate'))} dados {data(ed.get('dataLastEditDate'))} | {cont.get('count')} feições | geojson {tam//1024} KB | campos {campos} | ex {props}")
    except Exception as e:
        print(nome, "erro", e)
