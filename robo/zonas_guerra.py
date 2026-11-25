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
import math
import os
import sys
import time

import requests
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "site", "geo", "zonas_guerra.geojson")
URL = "https://deepstatemap.live/api/history/last"
TIPOS = {"geojson.status.occupied": "ocupado", "geojson.status.unknown": "contestado"}
AREA_UCRANIA_KM2 = 603628  # território reconhecido, com a Crimeia
RAIO_KM = 6371.0088


def area_anel(coords):
    """Área de um anel lon/lat sobre a esfera (Chamberlain & Duquette, 2007)."""
    s = 0.0
    for (x1, y1), (x2, y2) in zip(coords, coords[1:] + coords[:1]):
        s += math.radians(x2 - x1) * (2 + math.sin(math.radians(y1)) + math.sin(math.radians(y2)))
    return abs(s) * RAIO_KM * RAIO_KM / 2


def area_km2(g):
    if g.is_empty:
        return 0.0
    polis = list(g.geoms) if g.geom_type == "MultiPolygon" else [g]
    return sum(area_anel([c[:2] for c in p.exterior.coords]) - sum(area_anel([c[:2] for c in i.coords]) for i in p.interiors)
               for p in polis)


def arredonda(coords):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], 3), round(coords[1], 3)]
    return [arredonda(c) for c in coords]


def ocupacao(dados, extras):
    """Áreas ocupada e contestada de um mapa do DeepStateMap. O DeepStateMap só desenha como "ocupado" o que
    a Rússia tomou depois de fevereiro de 2022; a Crimeia e o Donbas ocupados desde 2014 vêm do Natural Earth."""
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
        return None, None, 0
    ocupado = unary_union(grupos["ocupado"] + extras)
    contestado = unary_union(grupos["contestado"]).difference(ocupado) if grupos["contestado"] else None
    return ocupado, contestado, len(grupos["ocupado"])


def areas_de_2014():
    """Crimeia e partes de Donetsk e Luhansk ocupadas desde 2014, do arquivo de áreas disputadas (Natural Earth)."""
    try:
        areas = json.load(open(os.path.join(RAIZ, "site", "data", "areas.json"), encoding="utf-8"))
        nomes = {n for a in areas if a.get("deepstate") == "russia-ucrania" for n in a.get("ne", [])}
        geo = json.load(open(os.path.join(RAIZ, "site", "geo", "disputadas.geojson"), encoding="utf-8"))
        return [shape(f["geometry"]).buffer(0) for f in geo["features"] if f["properties"].get("nome_en") in nomes]
    except Exception as e:  # noqa: BLE001
        print(f"::warning::sem as áreas ocupadas desde 2014 ({e})")
        return []


def mapa_de_uma_semana_atras(sessao):
    """Mapa do DeepStateMap de cerca de 7 dias atrás, para a variação semanal. Se falhar, volta None."""
    try:
        lista = sessao.get("https://deepstatemap.live/api/history/public", timeout=90).json()
        alvo = time.time() - 7 * 86400
        ids = sorted(int(x["id"]) for x in lista if str(x.get("id", "")).isdigit())
        anteriores = [i for i in ids if i <= alvo]
        if not anteriores:
            return None
        for url in (f"https://deepstatemap.live/api/history/{anteriores[-1]}/geojson",
                    f"https://deepstatemap.live/api/history/{anteriores[-1]}"):
            r = sessao.get(url, timeout=90)
            if r.status_code == 404:
                continue
            r.raise_for_status()
            d = r.json()
            if d.get("type") == "FeatureCollection":  # o endpoint /geojson devolve o mapa direto
                d = {"id": anteriores[-1], "map": d}
            if (d.get("map") or {}).get("features"):
                return d
        print("::warning::mapa de 7 dias atrás não encontrado no DeepStateMap; a variação usa o histórico guardado")
        return None
    except Exception as e:  # noqa: BLE001
        print(f"::warning::mapa de 7 dias atrás indisponível ({e}); a variação usa o histórico guardado")
        return None


def main():
    sessao = requests.Session()
    sessao.headers["User-Agent"] = "mapa-raccoon-mundi/1.0 (+https://github.com/raccoonmundi/raccoonmundi.github.io)"
    try:
        r = sessao.get(URL, timeout=90)
        r.raise_for_status()
        dados = r.json()
    except Exception as e:  # noqa: BLE001
        print(f"::warning::DeepStateMap indisponível ({e}); áreas em guerra mantidas.")
        return 0
    extras = areas_de_2014()
    ocupado, contestado, n_poligonos = ocupacao(dados, extras)
    if ocupado is None:
        print("::warning::DeepStateMap sem áreas ocupadas na resposta; áreas em guerra mantidas.")
        return 0
    data = data_do_mapa(dados)
    feats = [{"type": "Feature", "properties": {"tipo": "ocupado", "conflito": "russia-ucrania"},
              "geometry": arredonda_geo(ocupado.simplify(0.01, preserve_topology=True))}]
    if contestado is not None and not contestado.is_empty:
        feats.append({"type": "Feature", "properties": {"tipo": "contestado", "conflito": "russia-ucrania"},
                      "geometry": arredonda_geo(contestado.simplify(0.01, preserve_topology=True))})
    km_ocupado = round(area_km2(ocupado))
    km_contestado = round(area_km2(contestado)) if contestado is not None and not contestado.is_empty else 0
    # histórico das áreas (uma entrada por data do mapa) para mostrar a variação no painel
    historico = []
    try:
        historico = json.load(open(SAIDA, encoding="utf-8")).get("historico", [])
    except Exception:  # noqa: BLE001
        pass
    if not any(h["data"] <= (dt.date.fromisoformat(data) - dt.timedelta(days=6)).isoformat() for h in historico):
        antigo = mapa_de_uma_semana_atras(sessao)
        if antigo:
            oc_ant, ct_ant, _ = ocupacao(antigo, extras)
            if oc_ant is not None:
                historico.append({"data": data_do_mapa(antigo), "ocupado_km2": round(area_km2(oc_ant)),
                                  "contestado_km2": round(area_km2(ct_ant)) if ct_ant is not None and not ct_ant.is_empty else 0})
    historico = [h for h in historico if h.get("data") != data] + [{"data": data, "ocupado_km2": km_ocupado, "contestado_km2": km_contestado}]
    historico = sorted({h["data"]: h for h in historico}.values(), key=lambda h: h["data"])[-120:]
    saida = {"type": "FeatureCollection", "fonte": "DeepStateMap", "fonte_url": "https://deepstatemap.live",
             "data": data, "paises": ["UA", "RU"], "ocupado_km2": km_ocupado, "contestado_km2": km_contestado,
             "ocupado_pct": round(100 * km_ocupado / AREA_UCRANIA_KM2, 1), "historico": historico, "features": feats}
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(saida, f, separators=(",", ":"))
    print(f"áreas em guerra: {n_poligonos} polígonos ocupados, data {data}, {os.path.getsize(SAIDA) // 1024} KB; "
          f"ocupado {km_ocupado} km² ({saida['ocupado_pct']}%, com Crimeia e Donbas de 2014), contestado {km_contestado} km²; "
          f"histórico: {[(h['data'], h['ocupado_km2']) for h in historico[-3:]]}")
    return 0


def data_do_mapa(dados):
    """Data do mapa: o "id" costuma ser o carimbo Unix; o campo "datetime" vem como texto ("24.11 о 22:00")."""
    import re
    hoje = dt.datetime.now(dt.timezone.utc)
    for v in (dados.get("id"), dados.get("datetime")):
        try:
            n = int(v)
            if n > 1e9:
                return dt.datetime.fromtimestamp(n / (1000 if n > 1e11 else 1), dt.timezone.utc).strftime("%Y-%m-%d")
        except (TypeError, ValueError):
            pass
    m = re.search(r"(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?", str(dados.get("datetime") or ""))
    if m:
        ano = int(m.group(3) or hoje.year)
        d = dt.date(ano, int(m.group(2)), int(m.group(1)))
        if d > hoje.date():  # "31.12" lido em janeiro é do ano anterior
            d = d.replace(year=ano - 1)
        return d.isoformat()
    return hoje.strftime("%Y-%m-%d")


def arredonda_geo(g):
    m = mapping(g)
    return {"type": m["type"], "coordinates": arredonda(m["coordinates"])}


if __name__ == "__main__":
    sys.exit(main())
