#!/usr/bin/env python3
"""Gera site/data/cores_paises.json: uma cor (0 a 5) para cada país, como num mapa-múndi político.

Vizinhos nunca ficam com a mesma cor (coloração gulosa pelo grau, escolhendo a cor menos usada entre as
livres, para as seis aparecerem por igual). Os tons em si ficam em site/app.js (PALETAS.*.paises).
Rode depois de mudar site/geo/paises.geojson: python3 ferramentas/cores_paises.py
"""
import json
import os
from collections import defaultdict

from shapely.geometry import shape
from shapely.ops import unary_union
from shapely.strtree import STRtree

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
N_CORES = 6
FOLGA = 0.08  # graus: encosta quem quase se toca (contornos simplificados não batem certinho)


def main():
    geo = json.load(open(os.path.join(RAIZ, "site", "geo", "paises.geojson"), encoding="utf-8"))
    partes = defaultdict(list)
    for f in geo["features"]:
        k = f["properties"].get("k")
        if k and f["geometry"]:
            partes[k].append(shape(f["geometry"]).buffer(0))
    chaves = sorted(partes)
    formas = [unary_union(partes[k]).buffer(FOLGA) for k in chaves]
    arvore = STRtree(formas)
    viz = defaultdict(set)
    for i, g in enumerate(formas):
        for j in arvore.query(g, predicate="intersects"):
            if j != i:
                viz[chaves[i]].add(chaves[int(j)])
                viz[chaves[int(j)]].add(chaves[i])
    uso = [0] * N_CORES
    cor = {}
    for k in sorted(chaves, key=lambda k: (-len(viz[k]), k)):
        ocupadas = {cor[v] for v in viz[k] if v in cor}
        livres = [c for c in range(N_CORES) if c not in ocupadas] or list(range(N_CORES))
        c = min(livres, key=lambda c: (uso[c], c))
        cor[k] = c
        uso[c] += 1
    conflitos = [(a, b) for a in cor for b in viz[a] if cor[a] == cor[b]]
    caminho = os.path.join(RAIZ, "site", "data", "cores_paises.json")
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dict(sorted(cor.items())), f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    print(f"{len(cor)} países · uso por cor {uso} · vizinhos com a mesma cor: {len(conflitos) // 2}")


if __name__ == "__main__":
    main()
