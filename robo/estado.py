#!/usr/bin/env python3
"""Guarda e restaura o estado do robô entre as rodadas, pelo cache do GitHub Actions.

Com a coleta a cada 15 minutos, os dados não vão para o repositório a cada rodada (seriam 96 registros por
dia); só uma vez por dia. Entre uma rodada e outra, o histórico (noticias.json, com 48 h de matérias, e
zonas_guerra.geojson, com o histórico da área ocupada) fica na pasta .estado-robo, salva no cache.

  python robo/estado.py restaurar   # antes da coleta: usa o que for mais novo (cache ou repositório)
  python robo/estado.py guardar     # depois da coleta: copia os arquivos para .estado-robo
"""
import json
import os
import shutil
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASTA = os.path.join(RAIZ, ".estado-robo")
ARQUIVOS = [  # (arquivo no site, campo com a data da versão)
    (os.path.join(RAIZ, "site", "data", "noticias.json"), "gerado_em"),
    (os.path.join(RAIZ, "site", "geo", "zonas_guerra.geojson"), "data"),
]


def versao(caminho, campo):
    try:
        with open(caminho, encoding="utf-8") as f:
            v = json.load(f).get(campo)
        return v or ""
    except (OSError, ValueError):
        return None


def restaurar():
    for caminho, campo in ARQUIVOS:
        guardado = os.path.join(PASTA, os.path.basename(caminho))
        vc, vr = versao(guardado, campo), versao(caminho, campo)
        if vc is None:
            print(f"{os.path.basename(caminho)}: sem estado no cache; fica o do repositório ({vr})")
        elif vr is None or vc >= vr:
            shutil.copyfile(guardado, caminho)
            print(f"{os.path.basename(caminho)}: usando o do cache ({vc}; repositório: {vr})")
        else:
            print(f"{os.path.basename(caminho)}: o do repositório é mais novo ({vr} > {vc})")


def guardar():
    os.makedirs(PASTA, exist_ok=True)
    for caminho, campo in ARQUIVOS:
        if os.path.exists(caminho):
            shutil.copyfile(caminho, os.path.join(PASTA, os.path.basename(caminho)))
            print(f"guardado: {os.path.basename(caminho)} ({versao(caminho, campo)})")


if __name__ == "__main__":
    {"restaurar": restaurar, "guardar": guardar}[sys.argv[1]]()
