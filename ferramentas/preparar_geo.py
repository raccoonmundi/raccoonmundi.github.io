#!/usr/bin/env python3
"""
Prepara os dados geográficos do mapa a partir do Natural Earth (escala 1:50 milhões).

Roda uma vez (ou quando mudar a lista de macrorregiões). Gera:
  site/data/paises.json         -> país (código ISO) -> nomes, códigos FIPS do GDELT, macrorregião
  site/data/macrorregioes.json  -> as 17 macrorregiões e seus países
  /tmp/geo_paises_full.geojson  -> contornos com propriedades mínimas (entrada do mapshaper)

Depois, o mapshaper simplifica os contornos e gera os arquivos de site/geo/ (ver README).

Fronteiras: padrão oficial do Natural Earth (situação de fato). Áreas disputadas
vêm de um arquivo à parte e aparecem hachuradas no mapa.
"""
import json
import os
import sys
import urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NE_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
ARQ_PAISES = "ne_50m_admin_0_countries.geojson"
ARQ_DISPUTA = "ne_50m_admin_0_breakaway_disputed_areas.geojson"

MACRORREGIOES = [
    ("america-do-norte", "América do Norte", "North America"),
    ("america-central-caribe", "América Central e Caribe", "Central America & Caribbean"),
    ("america-do-sul", "América do Sul", "South America"),
    ("europa-ocidental", "Europa Ocidental", "Western Europe"),
    ("europa-central-balcas", "Europa Central e Bálcãs", "Central Europe & Balkans"),
    ("europa-oriental", "Europa Oriental", "Eastern Europe"),
    ("russia", "Rússia", "Russia"),
    ("caucaso-asia-central", "Cáucaso e Ásia Central", "Caucasus & Central Asia"),
    ("oriente-medio", "Oriente Médio", "Middle East"),
    ("norte-da-africa", "Norte da África", "North Africa"),
    ("sahel-africa-ocidental", "Sahel e África Ocidental", "Sahel & West Africa"),
    ("chifre-africa-oriental", "Chifre da África e África Oriental", "Horn & East Africa"),
    ("africa-central-austral", "África Central e Austral", "Central & Southern Africa"),
    ("sul-da-asia", "Sul da Ásia", "South Asia"),
    ("leste-asiatico", "Leste Asiático", "East Asia"),
    ("sudeste-asiatico", "Sudeste Asiático", "Southeast Asia"),
    ("oceania", "Oceania", "Oceania"),
]

# Macrorregião padrão pela sub-região da ONU que o Natural Earth traz...
POR_SUBREGIAO = {
    "Northern America": "america-do-norte",
    "Central America": "america-central-caribe",
    "Caribbean": "america-central-caribe",
    "South America": "america-do-sul",
    "Western Europe": "europa-ocidental",
    "Northern Europe": "europa-ocidental",
    "Southern Europe": "europa-ocidental",
    "Eastern Europe": "europa-central-balcas",
    "Western Asia": "oriente-medio",
    "Central Asia": "caucaso-asia-central",
    "Southern Asia": "sul-da-asia",
    "Eastern Asia": "leste-asiatico",
    "South-Eastern Asia": "sudeste-asiatico",
    "Northern Africa": "norte-da-africa",
    "Western Africa": "sahel-africa-ocidental",
    "Middle Africa": "africa-central-austral",
    "Eastern Africa": "africa-central-austral",
    "Southern Africa": "africa-central-austral",
    "Australia and New Zealand": "oceania",
    "Melanesia": "oceania",
    "Micronesia": "oceania",
    "Polynesia": "oceania",
}
# ...com os ajustes editoriais da proposta aprovada (chave = ADM0_A3 do Natural Earth).
AJUSTES = {
    "MEX": "america-do-norte",
    "EST": "europa-oriental", "LVA": "europa-oriental", "LTU": "europa-oriental",
    "UKR": "europa-oriental", "BLR": "europa-oriental", "MDA": "europa-oriental",
    "RUS": "russia",
    "ALB": "europa-central-balcas", "BIH": "europa-central-balcas", "GRC": "europa-central-balcas",
    "HRV": "europa-central-balcas", "MNE": "europa-central-balcas", "MKD": "europa-central-balcas",
    "SRB": "europa-central-balcas", "SVN": "europa-central-balcas", "KOS": "europa-central-balcas",
    "CYP": "europa-central-balcas", "CYN": "europa-central-balcas",
    "GEO": "caucaso-asia-central", "ARM": "caucaso-asia-central", "AZE": "caucaso-asia-central",
    "IRN": "oriente-medio",
    "SDN": "chifre-africa-oriental", "SDS": "chifre-africa-oriental", "SOL": "chifre-africa-oriental",
    "SOM": "chifre-africa-oriental", "DJI": "chifre-africa-oriental", "ERI": "chifre-africa-oriental",
    "ETH": "chifre-africa-oriental", "KEN": "chifre-africa-oriental", "UGA": "chifre-africa-oriental",
    "TZA": "chifre-africa-oriental", "RWA": "chifre-africa-oriental", "BDI": "chifre-africa-oriental",
    "TCD": "sahel-africa-ocidental",
    "SGS": "america-do-sul", "IOA": "oceania",
}

# Códigos FIPS que o GDELT usa em sourcecountry e que faltam no Natural Earth.
FIPS_AJUSTES = {"SS": ["OD"], "NO": ["NO"], "IL": ["IS"], "PS": ["WE", "GZ"]}

# Territórios sem coleta própria: o painel aponta para o país de referência.
VER = {"SOL": "SO", "CYN": "CY", "KAS": None}

# Nomes em português do Brasil onde o Natural Earth usa a grafia de Portugal.
NOMES_BR = {
    "IR": "Irã", "YE": "Iêmen", "VN": "Vietnã", "KE": "Quênia", "AM": "Armênia", "PL": "Polônia",
    "RO": "Romênia", "SI": "Eslovênia", "MK": "Macedônia do Norte", "EE": "Estônia", "LV": "Letônia",
    "MC": "Mônaco", "BJ": "Benin", "CZ": "Tchéquia", "MG": "Madagascar", "MU": "Maurício",
    "MW": "Malaui", "TM": "Turcomenistão", "EH": "Saara Ocidental", "NC": "Nova Caledônia",
    "KY": "Ilhas Cayman", "DJ": "Djibuti", "BY": "Belarus", "IE": "Irlanda", "US": "Estados Unidos",
    "CN": "China", "SX": "Sint Maarten", "IOA": "Territórios Australianos do Oceano Índico",
}
NOMES_EN = {"CN": "China", "US": "United States", "BS": "Bahamas", "GM": "Gambia", "CI": "Côte d'Ivoire"}


def baixar(nome):
    destino = os.path.join("/tmp", nome)
    if not os.path.exists(destino):
        print("baixando", nome)
        urllib.request.urlretrieve(NE_URL + nome, destino)
    return json.load(open(destino, encoding="utf-8"))


def main():
    ne = baixar(ARQ_PAISES)
    feats, paises = [], {}
    for f in ne["features"]:
        p = f["properties"]
        a3 = p["ADM0_A3"]
        if p["SUBREGION"] == "Antarctica":
            continue
        regiao = AJUSTES.get(a3, POR_SUBREGIAO.get(p["SUBREGION"]))
        iso = p["ISO_A2_EH"] if p["ISO_A2_EH"] not in (None, "-99") else None
        chave = iso or a3  # territórios sem ISO (Somalilândia, Chipre do Norte) usam o código do Natural Earth
        feats.append({"type": "Feature", "geometry": f["geometry"],
                      "properties": {"k": chave, "r": regiao}})
        if chave in paises and (paises[chave]["_pop"] or 0) >= (p["POP_EST"] or 0):
            continue  # vários contornos com o mesmo ISO: vale o do território principal
        fips = FIPS_AJUSTES.get(chave) or ([p["FIPS_10"]] if p["FIPS_10"] not in (None, "-99") else [])
        if a3 in VER:
            fips = []
        paises[chave] = {
            "nome_pt": NOMES_BR.get(chave, p["NAME_PT"] or p["NAME"]),
            "nome_en": NOMES_EN.get(chave, p["NAME_EN"] or p["NAME"]),
            "fips": fips,
            "r": regiao,
            "_pop": p["POP_EST"],
        }
        if a3 in VER:
            paises[chave]["ver"] = VER[a3]
    for v in paises.values():
        v.pop("_pop", None)

    sem_regiao = sorted(k for k, v in paises.items() if not v["r"])
    print("sem macrorregião (ficam cinza, sem clique):", sem_regiao)

    macros = []
    for rid, pt, en in MACRORREGIOES:
        membros = sorted(k for k, v in paises.items() if v["r"] == rid)
        macros.append({"id": rid, "nome_pt": pt, "nome_en": en, "paises": membros})
        print(f"{pt:38s} {len(membros):3d} países/territórios")

    dados = os.path.join(RAIZ, "site", "data")
    os.makedirs(dados, exist_ok=True)
    json.dump(dict(sorted(paises.items())), open(os.path.join(dados, "paises.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    json.dump(macros, open(os.path.join(dados, "macrorregioes.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    json.dump({"type": "FeatureCollection", "features": feats},
              open("/tmp/geo_paises_full.geojson", "w", encoding="utf-8"))

    disp = baixar(ARQ_DISPUTA)
    dfeats = [{"type": "Feature", "geometry": f["geometry"],
               "properties": {"nome_pt": f["properties"].get("NAME_PT") or f["properties"]["BRK_NAME"],
                              "nome_en": f["properties"].get("NAME_EN") or f["properties"]["BRK_NAME"]}}
              for f in disp["features"]]
    json.dump({"type": "FeatureCollection", "features": dfeats},
              open("/tmp/geo_disputadas_full.geojson", "w", encoding="utf-8"))
    print("ok:", len(paises), "países/territórios,", len(dfeats), "áreas disputadas")


if __name__ == "__main__":
    sys.exit(main())
