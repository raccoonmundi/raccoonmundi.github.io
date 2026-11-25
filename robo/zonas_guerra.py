#!/usr/bin/env python3
"""
Áreas em guerra para o mapa: hoje, a ocupação russa na Ucrânia.

Fonte: DeepStateMap (deepstatemap.live), projeto ucraniano de mapeamento da linha de frente,
atualizado várias vezes por semana. O mapa cita a fonte e a data no rodapé e na legenda.
Gera site/geo/zonas_guerra.geojson com dois tipos de área:
  - "ocupado":    território sob controle russo (inclui Crimeia e Donbas ocupados antes de 2022);
  - "contestado": zona cinzenta, status desconhecido.
Se a fonte falhar, o arquivo anterior fica como está.
"""
import datetime as dt
import json
import os
import sys

import requests
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "site", "geo", "zonas_guerra.geojson")
URL = "https://deepstatemap.live/api/history/last"
TIPOS = {"geojson.status.occupied": "ocupado", "geojson.status.unknown": "contestado"}


def arredonda(coords):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], 3), round(coords[1], 3)]
    return [arredonda(c) for c in coords]


def main():
    try:
        r = requests.get(URL, headers={"User-Agent": "mapa-raccoon-mundi/1.0 (+https://github.com/KaueMB23/mapa-raccoon-mundi)"}, timeout=90)
        r.raise_for_status()
        dados = r.json()
    except Exception as e:  # noqa: BLE001
        print(f"::warning::DeepStateMap indisponível ({e}); áreas em guerra mantidas.")
        return 0
    grupos = {"ocupado": [], "contestado": []}
    for f in (dados.get("map") or {}).get("features", []):
        geo = f.get("geometry") or {}
        if geo.get("type") not in ("Polygon", "MultiPolygon"):
            continue
        nome = ((f.get("properties") or {}).get("name") or "").lower()
        tipo = next((t for chave, t in TIPOS.items() if chave in nome), None)
        if not tipo:
            continue
        try:
            g = shape({"type": geo["type"], "coordinates": [[p[:2] for p in anel] for anel in geo["coordinates"]]}
                      if geo["type"] == "Polygon" else geo)
            grupos[tipo].append(g.buffer(0))
        except Exception:  # noqa: BLE001
            continue
    if not grupos["ocupado"]:
        print("::warning::DeepStateMap sem áreas ocupadas na resposta; áreas em guerra mantidas.")
        return 0
    quando = dados.get("datetime") or dados.get("id")
    try:
        data = dt.datetime.fromtimestamp(int(quando) / (1000 if int(quando) > 1e11 else 1), dt.timezone.utc).strftime("%Y-%m-%d")
    except (TypeError, ValueError):
        data = str(quando)[:10] if quando else dt.date.today().isoformat()
    ocupado = unary_union(grupos["ocupado"])
    feats = [{"type": "Feature", "properties": {"tipo": "ocupado", "conflito": "russia-ucrania"},
              "geometry": arredonda_geo(ocupado.simplify(0.01, preserve_topology=True))}]
    if grupos["contestado"]:
        contestado = unary_union(grupos["contestado"]).difference(ocupado)
        if not contestado.is_empty:
            feats.append({"type": "Feature", "properties": {"tipo": "contestado", "conflito": "russia-ucrania"},
                          "geometry": arredonda_geo(contestado.simplify(0.01, preserve_topology=True))})
    saida = {"type": "FeatureCollection", "fonte": "DeepStateMap", "fonte_url": "https://deepstatemap.live",
             "data": data, "paises": ["UA", "RU"], "features": feats}
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(saida, f, separators=(",", ":"))
    area = sum(g.area for g in grupos["ocupado"])
    print(f"áreas em guerra: {len(grupos['ocupado'])} polígonos ocupados, {len(grupos['contestado'])} contestados, "
          f"data {data}, {os.path.getsize(SAIDA) // 1024} KB (área bruta {area:.1f} graus²)")
    return 0


def arredonda_geo(g):
    m = mapping(g)
    return {"type": m["type"], "coordinates": arredonda(m["coordinates"])}


if __name__ == "__main__":
    sys.exit(main())
