#!/usr/bin/env python3
"""Gera site/data/monumentos.json: as maquetes 3D do globo (blocos próprios, sem modelos de terceiros).

Cada monumento é uma lista de peças erguidas (fill-extrusion). Medidas em "unidades de tela"
(≈ 2 px no zoom 3 do MapLibre); x para leste, y para norte, a partir do ponto lat/lon.
A câmera olha do sul para o norte, então a frente de cada maquete fica virada para y negativo.

Formas (lidas por ferramentas/motor_globo.js):
  r   = retângulo [x, y, largura, profundidade, base, topo, cor]
  c   = cilindro [x, y, raio, base, topo, cor, lados]
  o   = octógono [x, y, lado, chanfro, base, topo, cor]
  e   = estrela [x, y, raio externo, raio interno, pontas, base, topo, cor]
  p   = polígono [aneis, base, topo, cor] (primeiro anel = contorno; os outros são furos)
  a   = anel elíptico [x, y, rx, ry, rx interno, ry interno, base, topo, cor, lados(, ângulo inicial, ângulo final)]
  deg = pirâmide em degraus [x, y, lado, degraus, altura, cor, cor alternada, base]

Campos de cada monumento: id, pais, estado (Brasil), nivel ("estado" = só aparece com o estado
selecionado), prio (1 = mais conhecido; ganha quando duas maquetes vizinhas encavalariam),
escala (opcional), lat, lon, nome_pt/en, lugar_pt/en, pecas.

Critério da lista: só países e estados com uma referência conhecida (pesquisada); quem não tem, fica sem.
Rode: python3 ferramentas/gerar_monumentos.py
"""
import json
import math
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

AGUA, GRAMA, MATA, AREIA, PRACA = "#77aad4", "#7ea468", "#5f8a4e", "#e3cf9e", "#b9b4aa"


def n(v):
    return round(v, 2)


# ---------- formas básicas ----------
def R(x, y, w, d, b, t, c): return ["r", n(x), n(y), n(w), n(d), n(b), n(t), c]
def C(x, y, r, b, t, c, lados=10): return ["c", n(x), n(y), n(r), n(b), n(t), c, lados]
def O(x, y, l, ch, b, t, c): return ["o", n(x), n(y), n(l), n(ch), n(b), n(t), c]
def E(x, y, r1, r2, k, b, t, c): return ["e", n(x), n(y), n(r1), n(r2), k, n(b), n(t), c]
def DEG(x, y, l, k, h, c, c2=None, b=0): return ["deg", n(x), n(y), n(l), k, n(h), c, c2 or c, n(b)]
def P(aneis, b, t, c): return ["p", [[[n(px), n(py)] for px, py in a] for a in aneis], n(b), n(t), c]


def A(x, y, rx, ry, ix, iy, b, t, c, lados=24, a0=None, a1=None):
    p = ["a", n(x), n(y), n(rx), n(ry), n(ix), n(iy), n(b), n(t), c, lados]
    return p + [a0, a1] if a0 is not None else p


def ret_girado(x, y, w, d, ang, cx=None, cy=None):
    """Retângulo de largura w (no eixo girado) e profundidade d, girado ang graus em torno de (x, y)."""
    g = math.radians(ang)
    pts = []
    for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        px, py = sx * w / 2, sy * d / 2
        pts.append((x + px * math.cos(g) - py * math.sin(g), y + px * math.sin(g) + py * math.cos(g)))
    return pts


def braco(cx, cy, comp, larg, ang):
    """Retângulo que sai do centro (cx, cy) na direção ang, com comprimento comp."""
    g = math.radians(ang)
    mx, my = cx + math.cos(g) * comp / 2, cy + math.sin(g) * comp / 2
    return ret_girado(mx, my, comp, larg, ang)


def cor_de(cores, i, k):
    if isinstance(cores, str):
        return cores
    return cores[min(len(cores) - 1, int(i * len(cores) / k))]


# ---------- moldes ----------
def cone(x, y, r0, r1, b, t, cores, k=5, lados=10):
    """Pilha de cilindros afinando de r0 para r1 (torres, morros, agulhas)."""
    h = (t - b) / k
    return [C(x, y, r0 + (r1 - r0) * i / max(1, k - 1), b + i * h, b + (i + 1) * h, cor_de(cores, i, k), lados) for i in range(k)]


def torre(x, y, w0, w1, b, t, cores, k=4, d0=None, d1=None):
    """Pilha de blocos afinando (de w0 x d0 para w1 x d1)."""
    d0 = w0 if d0 is None else d0
    d1 = w1 if d1 is None else d1
    h = (t - b) / k
    return [R(x, y, w0 + (w1 - w0) * i / max(1, k - 1), d0 + (d1 - d0) * i / max(1, k - 1), b + i * h, b + (i + 1) * h, cor_de(cores, i, k)) for i in range(k)]


def cupula(x, y, r, b, h, cores, k=4, lados=12):
    """Cúpula: degraus que seguem a curva de uma meia esfera."""
    return [C(x, y, r * math.sqrt(max(0.0, 1 - (i / k) ** 2)), b + h * i / k, b + h * (i + 1) / k, cor_de(cores, i, k), lados) for i in range(k)]


def esfera(x, y, r, zc, cor, k=5, lados=10):
    out = []
    for i in range(k):
        u = -1 + (2 * i + 1) / k
        out.append(C(x, y, r * math.sqrt(max(0.05, 1 - u * u)), zc - r + 2 * r * i / k, zc - r + 2 * r * (i + 1) / k, cor, lados))
    return out


def cebola(x, y, r, b, h, cor, lados=8):
    """Cúpula em bulbo (cebola) com ponta."""
    perfil = [0.75, 1.0, 0.95, 0.7, 0.4, 0.15]
    passo = h / len(perfil)
    return [C(x, y, r * f, b + i * passo, b + (i + 1) * passo, cor, lados) for i, f in enumerate(perfil)]


def montanha(x, y, r0, h, cores, k=8, deriva=(0.0, 0.0), lados=11, achatar=0.12):
    """Montanha em camadas, com o cume deslocado por 'deriva' (por camada)."""
    out = []
    for i in range(k):
        f = 1 - i / k
        r = r0 * (achatar + (1 - achatar) * f)
        out.append(C(x + deriva[0] * i, y + deriva[1] * i, r, h * i / k, h * (i + 1) / k, cor_de(cores, i, k), lados))
    return out


def colunas(pontos, raio, b, t, cor):
    return [C(px, py, raio, b, t, cor, 6) for px, py in pontos]


# ---------- primeiro lote (25/11/2026, desenhado à mão) ----------
ORIGINAIS = [
    {"id": "cristo-redentor", "pais": "BR", "estado": "BR-RJ", "lat": -22.9519, "lon": -43.2105, "nome_pt": "Cristo Redentor", "nome_en": "Christ the Redeemer", "lugar_pt": "Rio de Janeiro, Brasil", "lugar_en": "Rio de Janeiro, Brazil", "pecas": [["c", 0, 0, 6, 0, 3, "#5f8a4e", 10], ["c", -0.3, 0.2, 4.2, 3, 6, "#6f9a58", 9], ["c", -0.2, 0.1, 2.4, 6, 8.5, "#8e8a7e", 8], ["r", 0, 0, 2.8, 2.8, 8.5, 11, "#d3cdc1"], ["r", 0, 0, 2.6, 2.1, 11, 18, "#efebe2"], ["r", 0, 0, 2.2, 1.8, 18, 22.6, "#efebe2"], ["r", 0, 0, 13, 1.8, 20.2, 22.2, "#efebe2"], ["r", 0, 0, 1.5, 1.5, 22.6, 24.8, "#efebe2"]], "prio": 1},
    {"id": "masp", "pais": "BR", "estado": "BR-SP", "nivel": "estado", "lat": -23.5614, "lon": -46.6559, "nome_pt": "MASP", "nome_en": "MASP (São Paulo Museum of Art)", "lugar_pt": "São Paulo, Brasil", "lugar_en": "São Paulo, Brazil", "pecas": [["r", 0, 0, 23.5, 11.5, 0, 0.5, "#bdb8ad"], ["r", -10, -4.2, 1.6, 1.6, 0.5, 10.6, "#c62a22"], ["r", 10, -4.2, 1.6, 1.6, 0.5, 10.6, "#c62a22"], ["r", -10, 4.2, 1.6, 1.6, 0.5, 10.6, "#c62a22"], ["r", 10, 4.2, 1.6, 1.6, 0.5, 10.6, "#c62a22"], ["r", 0, 0, 19, 7, 4.4, 9.2, "#4f545c"], ["r", 0, 0, 19, 7, 9.2, 9.6, "#a3a6aa"], ["r", 0, -4.2, 21.6, 1.6, 3.4, 4.4, "#c62a22"], ["r", 0, 4.2, 21.6, 1.6, 3.4, 4.4, "#c62a22"], ["r", 0, -4.2, 21.6, 1.6, 9, 10.6, "#c62a22"], ["r", 0, 4.2, 21.6, 1.6, 9, 10.6, "#c62a22"]], "prio": 1},
    {"id": "torre-eiffel", "pais": "FR", "lat": 48.8584, "lon": 2.2945, "nome_pt": "Torre Eiffel", "nome_en": "Eiffel Tower", "lugar_pt": "Paris, França", "lugar_en": "Paris, France", "pecas": [["r", 0, 0, 16, 13, 0, 0.4, "#86a866"], ["r", -3.6, -3.6, 2.4, 2.4, 0.4, 6, "#8b6b4f"], ["r", 3.6, -3.6, 2.4, 2.4, 0.4, 6, "#8b6b4f"], ["r", -3.6, 3.6, 2.4, 2.4, 0.4, 6, "#8b6b4f"], ["r", 3.6, 3.6, 2.4, 2.4, 0.4, 6, "#8b6b4f"], ["r", 0, 0, 9.6, 9.6, 6, 7.3, "#7a5c44"], ["r", -2.4, -2.4, 1.6, 1.6, 7.3, 13, "#8b6b4f"], ["r", 2.4, -2.4, 1.6, 1.6, 7.3, 13, "#8b6b4f"], ["r", -2.4, 2.4, 1.6, 1.6, 7.3, 13, "#8b6b4f"], ["r", 2.4, 2.4, 1.6, 1.6, 7.3, 13, "#8b6b4f"], ["r", 0, 0, 6.2, 6.2, 13, 14, "#7a5c44"], ["r", 0, 0, 3.6, 3.6, 14, 19, "#8b6b4f"], ["r", 0, 0, 2.6, 2.6, 19, 24, "#8b6b4f"], ["r", 0, 0, 1.8, 1.8, 24, 29, "#8b6b4f"], ["r", 0, 0, 1.2, 1.2, 29, 32, "#8b6b4f"], ["r", 0, 0, 1.7, 1.7, 32, 33, "#7a5c44"], ["r", 0, 0, 0.5, 0.5, 33, 36, "#6a4f3d"]], "prio": 1},
    {"id": "piramides-gize", "pais": "EG", "lat": 29.9792, "lon": 31.1342, "nome_pt": "Pirâmides de Gizé", "nome_en": "Pyramids of Giza", "lugar_pt": "Gizé, Egito", "lugar_en": "Giza, Egypt", "pecas": [["r", -3, -3, 31, 27, 0, 0.3, "#ecdcb2"], ["deg", 4, 4, 14, 7, 10, "#d9b878", "#c4a062", 0.3], ["deg", -4, -4, 13, 7, 9.6, "#d4b273", "#bf9b5c", 0.3], ["deg", -10.5, -10.5, 7, 5, 5, "#d9b878", "#c4a062", 0.3], ["r", 6, -9, 1.4, 4, 0.3, 2, "#c9a466"], ["r", 6, -7.4, 1.3, 1.3, 2, 2.9, "#c9a466"]], "prio": 1},
    {"id": "estatua-liberdade", "pais": "US", "lat": 40.6892, "lon": -74.0445, "nome_pt": "Estátua da Liberdade", "nome_en": "Statue of Liberty", "lugar_pt": "Nova York, Estados Unidos", "lugar_en": "New York, United States", "pecas": [["c", 0, 0, 9, 0, 0.6, "#79a05f", 10], ["e", 0, 0, 6.6, 4.6, 11, 0.6, 2.4, "#c8bfae"], ["r", 0, 0, 3.6, 3.6, 2.4, 6, "#b9ae99"], ["r", 0, 0, 3, 3, 6, 9.5, "#c4b9a4"], ["r", 0, 0, 2.4, 2, 9.5, 14, "#6fb59f"], ["r", 0, 0, 2, 1.7, 14, 17.5, "#6fb59f"], ["r", 0, 0, 2.5, 1.6, 17.5, 18.6, "#6fb59f"], ["r", 0, 0, 1.1, 1.1, 18.6, 20.2, "#6fb59f"], ["e", 0, 0, 1.3, 0.6, 7, 19.8, 20.7, "#6fb59f"], ["r", -1.1, 0, 0.7, 0.7, 17.5, 23.5, "#6fb59f"], ["r", -1.1, 0, 1.2, 1.2, 23.5, 24.3, "#6fb59f"], ["c", -1.1, 0, 0.55, 24.3, 25.8, "#f0b93a", 6], ["r", 1.35, 0.2, 0.6, 1.1, 13, 16, "#62a691"]], "prio": 1},
    {"id": "big-ben", "pais": "GB", "lat": 51.5007, "lon": -0.1246, "nome_pt": "Big Ben e Parlamento", "nome_en": "Big Ben and Parliament", "lugar_pt": "Londres, Reino Unido", "lugar_en": "London, United Kingdom", "pecas": [["r", -1, -4.6, 26, 3.2, 0, 0.25, "#7fa9c9"], ["r", -2.5, 0, 13, 4.4, 0, 5, "#c4a873"], ["r", -2.5, 0, 12, 3.4, 5, 6.2, "#8f918c"], ["r", -9.6, 0, 3.4, 3.4, 0, 13, "#c4a873"], ["r", -9.6, 0, 2.6, 2.6, 13, 14.6, "#c4a873"], ["r", 6, 0, 2.8, 2.8, 0, 17, "#cdb27e"], ["r", 6, 0, 3.4, 3.4, 17, 20.6, "#dcc493"], ["r", 6, 0, 2.8, 2.8, 20.6, 23, "#cdb27e"], ["r", 6, 0, 2, 2, 23, 25.5, "#3f4b55"], ["r", 6, 0, 1.2, 1.2, 25.5, 28, "#3f4b55"], ["r", 6, 0, 0.5, 0.5, 28, 30, "#c9a24a"]], "prio": 1},
    {"id": "kremlin", "pais": "RU", "lat": 55.7525, "lon": 37.6231, "nome_pt": "Kremlin e Catedral de São Basílio", "nome_en": "Kremlin and St Basil's Cathedral", "lugar_pt": "Moscou, Rússia", "lugar_en": "Moscow, Russia", "pecas": [["r", 0, -4, 24, 9, 0, 0.3, "#9a8f86"], ["r", 0, 1.6, 26, 1.4, 0, 4.2, "#b0392c"], ["r", -3, 1.6, 3.8, 3.8, 0, 9, "#b23a2e"], ["r", -3, 1.6, 3.2, 3.2, 9, 10.2, "#bd4536"], ["r", -3, 1.6, 3.2, 3.2, 10.2, 11.6, "#e8dfcc"], ["r", -3, 1.6, 2.6, 2.6, 11.6, 13.6, "#bd4536"], ["r", -3, 1.6, 1.8, 1.8, 13.6, 16.5, "#3f7a55"], ["r", -3, 1.6, 1, 1, 16.5, 19, "#3f7a55"], ["r", -3, 1.6, 0.5, 0.5, 19, 19.6, "#d9b44a"], ["e", -3, 1.6, 0.9, 0.4, 5, 19.6, 21, "#e0262b"], ["r", 7, -5, 6, 6, 0.3, 3.2, "#b5493b"], ["c", 7, -5, 1.4, 3.2, 8, "#c8553f", 8], ["c", 7, -5, 0.9, 8, 10.5, "#d9b44a", 8], ["c", 7, -5, 0.3, 10.5, 11.6, "#d9b44a", 6], ["c", 5, -7, 0.9, 3.2, 5.4, "#c8553f", 8], ["c", 5, -7, 1.2, 5.4, 6.6, "#3a8f5d", 8], ["c", 5, -7, 0.6, 6.6, 7.4, "#3a8f5d", 6], ["c", 9, -7, 0.9, 3.2, 5.4, "#c8553f", 8], ["c", 9, -7, 1.2, 5.4, 6.6, "#d8a531", 8], ["c", 9, -7, 0.6, 6.6, 7.4, "#d8a531", 6], ["c", 5, -3, 0.9, 3.2, 5.4, "#c8553f", 8], ["c", 5, -3, 1.2, 5.4, 6.6, "#2f6fb3", 8], ["c", 5, -3, 0.6, 6.6, 7.4, "#2f6fb3", 6], ["c", 9, -3, 0.9, 3.2, 5.4, "#c8553f", 8], ["c", 9, -3, 1.2, 5.4, 6.6, "#d0463a", 8], ["c", 9, -3, 0.6, 6.6, 7.4, "#e9e2d2", 6]], "prio": 1},
    {"id": "taj-mahal", "pais": "IN", "lat": 27.1751, "lon": 78.0421, "nome_pt": "Taj Mahal", "nome_en": "Taj Mahal", "lugar_pt": "Agra, Índia", "lugar_en": "Agra, India", "pecas": [["r", 0, -6, 20, 26, 0, 0.3, "#7ea468"], ["r", 0, -11, 1.6, 11, 0, 0.45, "#77aad4"], ["r", 0, 4, 17, 17, 0.3, 1.8, "#e9e3d6"], ["o", 0, 4, 9.4, 2.4, 1.8, 8.4, "#f5f2ec"], ["r", 0, -0.85, 3.2, 0.4, 2, 7.6, "#ddd6c8"], ["c", -2.9, 1.1, 1, 8.4, 10, "#f2efe8", 8], ["c", 2.9, 1.1, 1, 8.4, 10, "#f2efe8", 8], ["c", -2.9, 6.9, 1, 8.4, 10, "#f2efe8", 8], ["c", 2.9, 6.9, 1, 8.4, 10, "#f2efe8", 8], ["c", 0, 4, 2.9, 8.4, 9.8, "#f2efe8", 12], ["c", 0, 4, 3.3, 9.8, 11.4, "#f7f4ef", 12], ["c", 0, 4, 3, 11.4, 12.6, "#f7f4ef", 12], ["c", 0, 4, 2.3, 12.6, 13.6, "#f7f4ef", 12], ["c", 0, 4, 1.3, 13.6, 14.4, "#f7f4ef", 10], ["c", 0, 4, 0.3, 14.4, 16.2, "#d4ac4a", 6], ["c", -7.5, -3.5, 0.65, 1.8, 12.4, "#f1ede4", 8], ["c", 7.5, -3.5, 0.65, 1.8, 12.4, "#f1ede4", 8], ["c", -7.5, 11.5, 0.65, 1.8, 12.4, "#f1ede4", 8], ["c", 7.5, 11.5, 0.65, 1.8, 12.4, "#f1ede4", 8], ["c", -7.5, -3.5, 0.95, 12.4, 13.2, "#f1ede4", 8], ["c", 7.5, -3.5, 0.95, 12.4, 13.2, "#f1ede4", 8], ["c", -7.5, 11.5, 0.95, 12.4, 13.2, "#f1ede4", 8], ["c", 7.5, 11.5, 0.95, 12.4, 13.2, "#f1ede4", 8]], "prio": 1},
]

# ---------- referências dos países ----------
def paises():
    M = []

    def add(id_, pais, lat, lon, nome_pt, nome_en, lugar_pt, lugar_en, pecas, prio=3, escala=None):
        m = {"id": id_, "pais": pais, "prio": prio, "lat": lat, "lon": lon, "nome_pt": nome_pt, "nome_en": nome_en,
             "lugar_pt": lugar_pt, "lugar_en": lugar_en, "pecas": pecas}
        if escala:
            m["escala"] = escala
        M.append(m)

    # Américas
    add("cn-tower", "CA", 43.6426, -79.3871, "CN Tower", "CN Tower", "Toronto, Canadá", "Toronto, Canada", [
        R(0, 0, 10, 8, 0, 0.3, PRACA), C(0, 0, 2.2, 0.3, 3, "#b9b6ae", 6), C(0, 0, 1.4, 3, 22, "#cfccc4", 6), C(0, 0, 1.1, 22, 27, "#cfccc4", 6),
        C(0, 0, 3, 27, 28.6, "#8c8a85", 12), C(0, 0, 3.4, 28.6, 29.6, "#dedbd3", 12), C(0, 0, 2.6, 29.6, 31, "#5d6a75", 12),
        C(0, 0, 0.8, 31, 36, "#cfccc4", 6), C(0, 0, 1.4, 36, 37, "#dedbd3", 8), C(0, 0, 0.35, 37, 44, "#dedbd3", 6), C(0, 0, 0.3, 44, 46, "#d9534f", 6)], prio=2)
    escada = [R(0, -8.7 + i * 0.72, 3, 0.8, 0, (i + 1) * 1.1, "#d6cbb0") for i in range(9)]
    add("chichen-itza", "MX", 20.6843, -88.5678, "Chichén Itzá (El Castillo)", "Chichén Itzá (El Castillo)", "Iucatã, México", "Yucatán, Mexico", [
        R(0, 0, 24, 24, 0, 0.25, GRAMA), DEG(0, 0, 18, 9, 10, "#cbbd9c", "#bfb08d", 0.25), *escada,
        R(0, 0, 5, 5, 10.2, 13, "#c2b391"), R(0, 0, 5.6, 5.6, 13, 13.6, "#b5a684")], prio=2)
    add("obelisco-buenos-aires", "AR", -34.6037, -58.3816, "Obelisco", "Obelisk", "Buenos Aires, Argentina", "Buenos Aires, Argentina", [
        R(0, 0, 10, 10, 0, 0.3, "#9ea39e"), *torre(0, 0, 2.6, 1.7, 0.3, 26, "#efede6", k=4), R(0, 0, 1.1, 1.1, 26, 27, "#efede6"), R(0, 0, 0.5, 0.5, 27, 28, "#efede6")])
    moais = []
    for x in (-9, -6, -3, 0, 3, 6, 9):
        moais += [R(x, 0, 1.8, 1.4, 1.2, 7, "#6c6259"), R(x, 0.1, 1.6, 1.6, 7, 9.5, "#6c6259"), R(x, -0.6, 1.6, 0.6, 8.6, 9.2, "#5f564e"), R(x, -0.9, 0.5, 0.4, 7.6, 8.6, "#5f564e")]
    add("moais", "CL", -27.1258, -109.2769, "Moais (Ahu Tongariki)", "Moai (Ahu Tongariki)", "Ilha de Páscoa, Chile", "Easter Island, Chile", [
        R(0, -2, 26, 9, 0, 0.25, GRAMA), R(0, 0, 22, 3.5, 0.25, 1.2, "#7d776d"), *moais])
    add("machu-picchu", "PE", -13.1631, -72.5450, "Machu Picchu", "Machu Picchu", "Cusco, Peru", "Cusco, Peru", [
        R(-2, -2, 18, 12, 0, 1.5, "#6f9a58"), R(-2, -1, 15, 9, 1.5, 3, "#78a35f"), R(-2, 0, 11, 6, 3, 4.5, "#82ac66"),
        R(-4, 0, 2, 1.5, 4.5, 6, "#9c968a"), R(-1, 0.5, 2.5, 1.5, 4.5, 6, "#9c968a"), R(1.5, -0.5, 1.5, 1.5, 4.5, 6, "#9c968a"),
        *montanha(0, 9, 5, 17, ["#5f8a4e", "#5f8a4e", "#5f8a4e", "#56804a", "#56804a", "#7a7a6e"], k=6, lados=9)], prio=2)
    add("capitolio-havana", "CU", 23.1352, -82.3596, "Capitólio", "Capitolio", "Havana, Cuba", "Havana, Cuba", [
        R(0, 0, 22, 5, 0, 4.5, "#ddd6c4"), R(0, 0, 21, 4, 4.5, 5, "#cfc8b5"), R(0, -3.1, 6, 1.4, 0, 5.5, "#e6e0d0"),
        C(0, 0, 3.2, 5, 7.5, "#d8d2c2", 12), C(0, 0, 2.6, 7.5, 9, "#e6e0d0", 12), *cupula(0, 0, 2.6, 9, 4.5, "#e9e4d6"),
        C(0, 0, 0.7, 13.5, 15.5, "#e6e0d0", 8), C(0, 0, 0.3, 15.5, 16.5, "#d4b04a", 6)])
    add("mitad-del-mundo", "EC", -0.0022, -78.4558, "Monumento à Metade do Mundo", "Middle of the World Monument", "Quito, Equador", "Quito, Ecuador", [
        R(0, 0, 16, 16, 0, 0.3, PRACA), R(0, 0, 16, 0.4, 0.3, 0.4, "#e9c03a"),
        R(0, 0, 4.6, 4.6, 0.3, 4, "#c9b68f"), R(0, 0, 4, 4, 4, 8, "#c9b68f"), R(0, 0, 3.4, 3.4, 8, 12, "#c9b68f"), *esfera(0, 0, 2, 14, "#c8a24a")])
    add("tikal", "GT", 17.2221, -89.6237, "Tikal (Templo I)", "Tikal (Temple I)", "Petén, Guatemala", "Petén, Guatemala", [
        R(0, 0, 16, 14, 0, 0.3, "#4f7d45"), C(-6, 4, 1.5, 0.3, 2.5, "#3f6e3a", 7), C(6, 3.5, 1.7, 0.3, 2.8, "#3f6e3a", 7), C(-5.5, -4.5, 1.3, 0.3, 2.2, "#3f6e3a", 7),
        DEG(0, 0, 9, 9, 13, "#bfb6a2", "#b3aa96", 0.3), R(0, -3.6, 2.4, 1.8, 0.3, 10, "#c7bea9"),
        R(0, 0.8, 3.2, 2.6, 13.3, 16, "#b3aa96"), R(0, 1.2, 2.6, 1, 16, 19.5, "#a89f8b")])

    # Europa
    add("coliseu", "IT", 41.8902, 12.4922, "Coliseu", "Colosseum", "Roma, Itália", "Rome, Italy", [
        A(0, 0, 5, 3.8, 0, 0, 0, 0.6, "#bfa47a", 24), A(0, 0, 9, 7.5, 5, 3.8, 0, 2.2, "#cdb48a", 28), A(0, 0, 9, 7.5, 5.2, 4, 2.2, 4.3, "#d6bd93", 28),
        A(0, 0, 9, 7.5, 5.4, 4.2, 4.3, 6.4, "#cdb48a", 28), A(0, 0, 9, 7.5, 5.6, 4.4, 6.4, 8.6, "#c4aa7f", 28, 15, 200)], prio=1)
    torres_sf = []
    for x in (-3, -1, 1, 3):
        torres_sf += cone(x, -3.3, 0.8, 0.25, 6, 18, "#c9b691", k=4, lados=8) + cone(x, 3.3, 0.8, 0.25, 6, 17, "#c4b08b", k=4, lados=8)
    add("sagrada-familia", "ES", 41.4036, 2.1744, "Sagrada Família", "Sagrada Família", "Barcelona, Espanha", "Barcelona, Spain", [
        R(0, 0, 12, 8, 0, 0.3, PRACA), R(0, 0, 10, 6, 0.3, 6, "#c7b48f"), R(0, 0, 9, 4, 6, 8, "#bfa984"), *torres_sf,
        *cone(0, 1.8, 1.1, 0.3, 8, 22, "#cdbc98", k=5, lados=10), *cone(0, 0, 1.6, 0.3, 8, 26, "#d2c29f", k=6, lados=10), C(0, 0, 0.5, 26, 27, "#ece7da", 8)], prio=1)
    add("portao-brandemburgo", "DE", 52.5163, 13.3777, "Portão de Brandemburgo", "Brandenburg Gate", "Berlim, Alemanha", "Berlin, Germany", [
        R(0, 0, 22, 8, 0, 0.3, PRACA), R(0, 0, 16, 4.5, 0.3, 0.7, "#bcb3a0"),
        *[R(x, 0, 1.1, 3.4, 0.7, 6.4, "#d7ccb2") for x in (-6.25, -3.75, -1.25, 1.25, 3.75, 6.25)],
        R(0, 0, 16, 4, 6.4, 8, "#d0c5ab"), R(0, 0, 8, 3.4, 8, 9.5, "#cbbfa4"),
        R(-9.5, 0, 3, 4, 0.3, 5, "#d0c5ab"), R(9.5, 0, 3, 4, 0.3, 5, "#d0c5ab"),
        R(0, 0, 2.6, 1.6, 9.5, 10.8, "#5e8a73"), C(0, 0.3, 0.4, 10.8, 12.4, "#5e8a73", 6)], prio=1)
    add("torre-de-belem", "PT", 38.6916, -9.2160, "Torre de Belém", "Belém Tower", "Lisboa, Portugal", "Lisbon, Portugal", [
        R(0, -3, 16, 12, 0, 0.25, AGUA), O(0, -2.5, 8, 2, 0.25, 4, "#e3dccb"), R(0, 2, 4.2, 4.2, 0.25, 13, "#e8e1d0"),
        R(0, 2, 4.6, 4.6, 13, 14, "#ddd5c2"), R(0, 2, 3, 3, 14, 15.5, "#e8e1d0"),
        C(-3.3, -5.2, 0.6, 4, 6, "#e8e1d0", 8), C(3.3, -5.2, 0.6, 4, 6, "#e8e1d0", 8), C(-3.3, -5.2, 0.7, 6, 6.6, "#d3cab6", 8), C(3.3, -5.2, 0.7, 6, 6.6, "#d3cab6", 8)], prio=2)
    frente = [(-5.6 + i * 1.6, -2.8) for i in range(8)] + [(-5.6 + i * 1.6, 2.8) for i in range(8)]
    lados_p = [(-5.6, -2.8 + i * 0.93) for i in range(1, 6)] + [(5.6, -2.8 + i * 0.93) for i in range(1, 6)]
    add("partenon", "GR", 37.9715, 23.7267, "Partenon (Acrópole)", "Parthenon (Acropolis)", "Atenas, Grécia", "Athens, Greece", [
        R(0, 0, 22, 12, 0, 3, "#a59f8f"), R(0, 0, 19, 10, 3, 4, "#b1ab9a"), R(0, 0, 13, 6.5, 4, 4.8, "#e7e1d2"),
        *colunas(frente + lados_p, 0.34, 4.8, 9, "#ece6d8"), R(0, 0, 9, 3.6, 4.8, 8.6, "#d6cfbf"),
        R(0, 0, 12.4, 6, 9, 10, "#e2dccd"), R(0, 0, 12.4, 4, 10, 10.6, "#ddd6c6"), R(0, 0, 12.4, 2, 10.6, 11.2, "#d8d1c1")], prio=1)
    add("moinho-kinderdijk", "NL", 51.8838, 4.6394, "Moinhos de Kinderdijk", "Kinderdijk windmills", "Kinderdijk, Países Baixos", "Kinderdijk, Netherlands", [
        R(0, -3.5, 16, 4, 0, 0.25, AGUA), R(0, 2.5, 16, 8, 0, 0.3, GRAMA), *cone(0, 1.5, 2.4, 1.4, 0.3, 9, "#6b5a4a", k=4, lados=8),
        C(0, 1.5, 1.6, 9, 10.4, "#4b4a47", 8), R(0, -1, 0.7, 0.3, 3, 17, "#ede6d4"), R(0, -1, 14, 0.3, 9.6, 10.6, "#ede6d4"), C(0, -1.2, 0.5, 9.4, 10.8, "#3d3a36", 8)])
    s, z0 = 3.3, 10.5
    atomo = []
    pos = [(0, 0, -math.sqrt(3)), (0, 0, math.sqrt(3)), (0, 0, 0)]
    for k in range(3):
        g = math.radians(90 + 120 * k)
        pos.append((math.sqrt(8 / 3) * math.cos(g), math.sqrt(8 / 3) * math.sin(g), -1 / math.sqrt(3)))
        g2 = math.radians(150 + 120 * k)
        pos.append((math.sqrt(8 / 3) * math.cos(g2), math.sqrt(8 / 3) * math.sin(g2), 1 / math.sqrt(3)))
    for px, py, pz in pos:
        atomo += esfera(px * s, py * s, 1.6, z0 + pz * s, "#c8ccd2", k=4)
    atomo += [C(0, 0, 0.45, 0.3, z0 + math.sqrt(3) * s, "#b4b9bf", 6)]
    for px, py, pz in pos[3::2]:
        atomo.append(C(px * s, py * s, 0.3, 0.3, z0 + pz * s - 1.4, "#b4b9bf", 6))
    add("atomium", "BE", 50.8949, 4.3415, "Atomium", "Atomium", "Bruxelas, Bélgica", "Brussels, Belgium", [R(0, 0, 16, 16, 0, 0.3, PRACA), *atomo], prio=2)
    add("matterhorn", "CH", 45.9763, 7.6586, "Matterhorn (Monte Cervino)", "Matterhorn", "Zermatt, Suíça", "Zermatt, Switzerland", [
        R(0, 0, 22, 20, 0, 0.6, "#6f9a58"),
        *[R(0.35 * i, 0.15 * i, 16 * (1 - i / 9), 14 * (1 - i / 9), 0.6 + i * 2, 0.6 + (i + 1) * 2,
            ["#7d7a74", "#7d7a74", "#86827b", "#d9dde2", "#7d7a74", "#e9ecef", "#f2f4f6", "#8a8781"][i]) for i in range(8)]], prio=2)
    add("palacio-cultura-varsovia", "PL", 52.2318, 21.0060, "Palácio da Cultura e da Ciência", "Palace of Culture and Science", "Varsóvia, Polônia", "Warsaw, Poland", [
        R(0, 0, 16, 10, 0, 3, "#cfc3a6"), R(0, 0, 10, 8, 3, 7, "#d6cbae"), R(0, 0, 6, 6, 7, 14, "#d6cbae"), R(0, 0, 5, 5, 14, 18, "#d6cbae"),
        R(0, 0, 4, 4, 18, 21, "#d6cbae"), R(0, 0, 3, 3, 21, 23.5, "#d6cbae"), R(0, 0, 2.2, 2.2, 23.5, 25, "#d6cbae"), R(0, 0, 2.4, 2.4, 25, 26.2, "#e6dcc2"),
        *cone(0, 0, 0.9, 0.15, 26.2, 32, "#cfc3a6", k=4, lados=8)])
    add("parlamento-budapeste", "HU", 47.5071, 19.0457, "Parlamento", "Parliament", "Budapeste, Hungria", "Budapest, Hungary", [
        R(0, -5, 28, 4, 0, 0.25, AGUA), R(0, 0, 26, 5, 0, 5, "#e8e2d6"), R(0, 0, 25, 4, 5, 6.5, "#b0473a"),
        *[C(x, -2.6, 0.35, 5, 7.5, "#e8e2d6", 6) for x in range(-12, 13, 3)],
        C(0, 0, 2.6, 6.5, 9, "#e8e2d6", 12), *cupula(0, 0, 2.6, 9, 4, "#a8443a"), C(0, 0, 0.4, 13, 15.5, "#e8e2d6", 6)], prio=2)
    add("pequena-sereia", "DK", 55.6929, 12.5993, "Pequena Sereia", "The Little Mermaid", "Copenhague, Dinamarca", "Copenhagen, Denmark", [
        R(0, 0, 12, 10, 0, 0.25, AGUA), C(0, 0, 2.6, 0.25, 1.6, "#6f6b65", 7), C(0.6, 0.4, 1.6, 1.6, 2.6, "#7a756e", 7),
        C(-0.6, 0, 0.7, 2.6, 3.6, "#3d7a66", 8), R(0.2, 0.1, 0.8, 0.6, 3.6, 5.6, "#3d7a66"), C(0.2, 0.1, 0.4, 5.6, 6.4, "#3d7a66", 8)], escala=1.6)
    add("mae-patria-kiev", "UA", 50.4266, 30.5631, "Monumento à Mãe-Pátria", "Motherland Monument", "Kiev, Ucrânia", "Kyiv, Ukraine", [
        R(0, 0, 12, 12, 0, 1.5, "#7ea468"), C(0, 0, 3.2, 1.5, 7, "#c6c9cc", 12), R(0, 0, 1.8, 1.4, 7, 17, "#bfc4c9"), C(0, 0, 0.6, 17, 18.4, "#bfc4c9", 8),
        R(-1.3, 0, 0.6, 0.6, 14, 20, "#bfc4c9"), R(-1.3, 0, 0.3, 0.3, 20, 27, "#d4d8dc"), R(1.6, -0.5, 2, 0.4, 12, 15, "#bfc4c9")])
    minaretes_hs = []
    for x, y in ((-6.5, -5.5), (6.5, -5.5), (-6.5, 5.5), (6.5, 5.5)):
        minaretes_hs += [C(x, y, 0.55, 0, 15, "#e3cfbe", 8), C(x, y, 0.75, 11, 11.5, "#e3cfbe", 8), *cone(x, y, 0.6, 0.1, 15, 18, "#7f8b93", k=3, lados=8)]
    add("hagia-sophia", "TR", 41.0086, 28.9802, "Santa Sofia", "Hagia Sophia", "Istambul, Turquia", "Istanbul, Türkiye", [
        R(0, 0, 14, 12, 0, 4, "#d9a98a"), *cupula(0, -3.5, 3, 4, 2, "#8e9aa3", k=3), *cupula(0, 3.5, 3, 4, 2, "#8e9aa3", k=3),
        C(0, 0, 3.8, 4, 6, "#d9a98a", 14), *cupula(0, 0, 3.8, 6, 3.2, "#8e9aa3", k=4, lados=14), *minaretes_hs], prio=1)
    degraus_hk = []
    for i in range(1, 7):
        h = 20 - 3 * i
        degraus_hk += [R(-(1.55 + 0.7 * (i - 1)), -1, 0.7, 2, 0, h, "#d9d7d0"), R(1.55 + 0.7 * (i - 1), -1, 0.7, 2, 0, h, "#d9d7d0")]
    add("hallgrimskirkja", "IS", 64.1417, -21.9266, "Hallgrímskirkja", "Hallgrímskirkja", "Reykjavík, Islândia", "Reykjavík, Iceland", [
        R(0, 1, 14, 14, 0, 0.3, PRACA), R(0, 4, 4, 6, 0, 9, "#d7d5ce"), R(0, 4, 3, 6, 9, 10.5, "#5a6470"), *degraus_hk,
        R(0, -1, 2.4, 2, 0, 22, "#e3e1db"), R(0, -1, 1.4, 1.4, 22, 25, "#e3e1db"), R(0, -1, 0.6, 0.6, 25, 27.5, "#e3e1db")])
    add("ponte-carlos", "CZ", 50.0865, 14.4114, "Ponte Carlos", "Charles Bridge", "Praga, Tchéquia", "Prague, Czechia", [
        R(0, 0, 32, 8, 0, 0.25, AGUA), *[R(x, 0, 1, 2.4, 0, 2.2, "#958a78") for x in range(-10, 11, 4)], R(0, 0, 26, 1.8, 2.2, 3, "#a39784"),
        R(-14, 0, 3, 3, 0, 10, "#7a6f62"), R(-14, 0, 2.4, 2.4, 10, 11.5, "#3f4448"), R(-14, 0, 1.2, 1.2, 11.5, 13.5, "#3f4448"),
        *[C(x, s_, 0.25, 3, 4.2, "#3b3a36", 6) for x in (-10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10) for s_ in (-0.75, 0.75)]])
    add("castelo-de-bran", "RO", 45.5149, 25.3672, "Castelo de Bran", "Bran Castle", "Bran, Romênia", "Bran, Romania", [
        C(0, 0, 6, 0, 4, "#6f9a58", 9), C(0, 0.5, 4.6, 4, 6, "#8a8781", 9), R(-0.5, 0, 6, 4, 6, 11, "#efe9dd"), R(-0.5, 0, 6.4, 4.4, 11, 12, "#b5543c"),
        R(-0.5, 0, 4, 2.6, 12, 13, "#b5543c"), C(2.4, -1.6, 1.1, 6, 14, "#efe9dd", 10), *cone(2.4, -1.6, 1.3, 0.1, 14, 17, "#b5543c", k=3),
        C(-3.2, 1.2, 0.9, 6, 12.5, "#efe9dd", 10), *cone(-3.2, 1.2, 1.1, 0.1, 12.5, 15, "#b5543c", k=3)])

    # Oriente Médio e África
    add("kingdom-centre", "SA", 24.7114, 46.6744, "Kingdom Centre", "Kingdom Centre", "Riad, Arábia Saudita", "Riyadh, Saudi Arabia", [
        R(0, 0, 12, 8, 0, 0.3, PRACA), R(0, 0, 8, 6, 0.3, 3, "#6f7f8a"), R(0, 0, 5, 3, 3, 14, "#7d8f9b"), R(0, 0, 4.8, 2.8, 14, 22, "#7d8f9b"),
        R(-1.9, 0, 1.2, 2.6, 22, 26, "#7d8f9b"), R(1.9, 0, 1.2, 2.6, 22, 26, "#7d8f9b"), R(-1.6, 0, 1, 2.2, 26, 30, "#7d8f9b"), R(1.6, 0, 1, 2.2, 26, 30, "#7d8f9b"),
        R(-1.2, 0, 0.7, 1.6, 30, 33, "#7d8f9b"), R(1.2, 0, 0.7, 1.6, 30, 33, "#7d8f9b"), R(0, 0, 4.2, 1.2, 28.3, 29.2, "#a7b2ba")])
    burj = [C(0, 0, 1, 0.3, 44, "#b8c3cb", 8)]
    alas = [[5.5, 5.5, 5.5], [4.6, 5.5, 5.5], [4.6, 4.6, 5.5], [3.8, 4.6, 4.6], [3.8, 3.8, 4.6], [3, 3.8, 3.8], [3, 3, 3.8], [2.2, 3, 3], [2.2, 2.2, 3]]
    for i, ls in enumerate(alas):
        for j, l in enumerate(ls):
            burj.append(P([braco(0, 0, l, 2.2 - 0.1 * i, 90 + 120 * j)], 0.3 + i * 4.8, 0.3 + (i + 1) * 4.8, "#a9b6bf" if i % 2 else "#b5c1c9"))
    add("burj-khalifa", "AE", 25.1972, 55.2744, "Burj Khalifa", "Burj Khalifa", "Dubai, Emirados Árabes Unidos", "Dubai, United Arab Emirates", [
        R(0, 0, 14, 12, 0, 0.3, PRACA), *burj, *cone(0, 0, 0.8, 0.1, 44, 52, "#c9d2d8", k=4, lados=6)], prio=1)
    add("petra", "JO", 30.3222, 35.4515, "Petra (Al-Khazneh)", "Petra (Al-Khazneh)", "Petra, Jordânia", "Petra, Jordan", [
        R(0, -3, 16, 4, 0, 0.3, "#d9b391"), R(0, 1.2, 16, 4, 0, 16, "#c98d6f"), R(0, -1.1, 9, 0.6, 0, 7, "#d9a283"),
        *colunas([(-3.6, -1.6), (-1.2, -1.6), (1.2, -1.6), (3.6, -1.6)], 0.35, 0, 6.5, "#dca88a"), R(0, -1.3, 9.4, 0.8, 7, 8, "#d9a283"),
        C(0, -1.2, 1.3, 8.5, 13, "#dca88a", 10), R(-3.4, -1.2, 2.2, 0.8, 8.5, 13, "#d9a283"), R(3.4, -1.2, 2.2, 0.8, 8.5, 13, "#d9a283"), C(0, -1.2, 0.4, 13, 14.2, "#dca88a", 8)], prio=2)
    add("torre-azadi", "IR", 35.6997, 51.3381, "Torre Azadi", "Azadi Tower", "Teerã, Irã", "Tehran, Iran", [
        R(0, 0, 16, 16, 0, 0.3, "#a9b0a5"), R(-3.2, 0, 2, 5, 0.3, 8, "#e4ddcf"), R(3.2, 0, 2, 5, 0.3, 8, "#e4ddcf"), R(0, 0, 4.4, 5, 6.6, 8, "#e4ddcf"),
        R(0, 0, 8.4, 5, 8, 11, "#e4ddcf"), R(0, 0, 6, 3.6, 11, 14, "#e4ddcf"), R(0, 0, 3.6, 2.6, 14, 17, "#e4ddcf"), R(0, 0, 2.2, 2.2, 17, 18.5, "#d7d0c2")])
    add("zigurate-de-ur", "IQ", 30.9626, 46.1032, "Zigurate de Ur", "Ziggurat of Ur", "Nassíria, Iraque", "Nasiriyah, Iraq", [
        R(0, 0, 22, 18, 0, 0.3, AREIA), R(0, 0, 16, 11, 0.3, 4, "#c4a77a"), R(0, 0.8, 10, 7, 4, 7, "#bf9f70"), R(0, 1.4, 5, 4, 7, 9.5, "#b8986a"),
        R(0, -6.5, 1.6, 4, 0.3, 4, "#ccb084"), R(-3.5, -6.2, 1.2, 3, 0.3, 3, "#ccb084"), R(3.5, -6.2, 1.2, 3, 0.3, 3, "#ccb084")])
    add("mesquita-hassan-ii", "MA", 33.6083, -7.6328, "Mesquita Hassan II", "Hassan II Mosque", "Casablanca, Marrocos", "Casablanca, Morocco", [
        R(0, 8, 22, 6, 0, 0.25, AGUA), R(0, -3, 20, 6, 0, 0.3, "#cfc7b6"), R(-2, 2, 14, 8, 0.3, 4, "#e6e1d6"), R(-2, 2, 13, 7, 4, 4.8, "#3f7a63"),
        R(6, -1, 2.6, 2.6, 0.3, 30, "#d9cfbb"), R(6, -1, 2.8, 2.8, 24, 25.5, "#3f7a63"), R(6, -1, 1.4, 1.4, 30, 33, "#d9cfbb"),
        R(6, -1, 1.6, 1.6, 33, 33.6, "#3f7a63"), C(6, -1, 0.3, 33.6, 35, "#d4ac4a", 6)], prio=2)
    folhas = []
    for j in range(3):
        for k in range(6):
            d = 3.2 * (1 - k / 6.5)
            g = math.radians(90 + 120 * j)
            folhas.append(P([ret_girado(math.cos(g) * d, math.sin(g) * d, 1.5, 1.1, 90 + 120 * j)], 0.6 + k * 4.4, 0.6 + (k + 1) * 4.4, "#e6e2da"))
    add("maqam-echahid", "DZ", 36.7456, 3.0700, "Maqam Echahid (Monumento aos Mártires)", "Maqam Echahid (Martyrs' Memorial)", "Argel, Argélia", "Algiers, Algeria", [
        R(0, 0, 14, 14, 0, 0.6, PRACA), *folhas, C(0, 0, 0.6, 0.6, 2, "#f0b93a", 6)])
    cruz = [(-1.2, -4), (1.2, -4), (1.2, -1.2), (4, -1.2), (4, 1.2), (1.2, 1.2), (1.2, 4), (-1.2, 4), (-1.2, 1.2), (-4, 1.2), (-4, -1.2), (-1.2, -1.2)]
    cruz_peq = [(px * 0.45, py * 0.45) for px, py in cruz]
    add("lalibela", "ET", 12.0317, 39.0408, "Igrejas de Lalibela (Bete Giyorgis)", "Lalibela churches (Bete Giyorgis)", "Lalibela, Etiópia", "Lalibela, Ethiopia", [
        P([[(-7, -7), (7, -7), (7, 7), (-7, 7)], [(-5, -5), (-5, 5), (5, 5), (5, -5)]], 0, 3, "#a0714f"), R(0, 0, 10, 10, 0, 0.2, "#8a5f42"),
        P([cruz], 0.2, 3.3, "#b57f58"), P([cruz_peq], 3.3, 3.6, "#a06b47")], escala=1.2)
    acacias = []
    for x, y in ((-8, -7), (7, -8)):
        acacias += [C(x, y, 0.25, 0, 1.6, "#6b5440", 6), C(x, y, 1.4, 1.6, 2, "#5e7d3a", 9)]
    add("kilimanjaro", "TZ", -3.0674, 37.3556, "Kilimanjaro", "Kilimanjaro", "Tanzânia", "Tanzania", [
        C(0, 0, 11, 0, 2, "#7d8a5c", 12), C(0, 0, 8.5, 2, 4, "#83795f", 12), C(0, 0, 6.5, 4, 6, "#7a6f5a", 12), C(0, 0, 4.8, 6, 7.6, "#6f665a", 12),
        C(0, 0, 3.6, 7.6, 8.8, "#f2f3f5", 12), C(0, 0, 2.4, 8.8, 9.4, "#e9ebee", 12), *acacias], prio=2)
    add("montanha-da-mesa", "ZA", -33.9628, 18.4098, "Montanha da Mesa", "Table Mountain", "Cidade do Cabo, África do Sul", "Cape Town, South Africa", [
        R(0, -7, 26, 4, 0, 0.25, AGUA), R(0, 0, 22, 10, 0, 2.5, "#6f8a55"), R(0, 2, 20, 7, 2.5, 6, "#7c776c"), R(0, 2, 18, 6, 6, 7, "#857f73"),
        R(0, 2, 17, 5.4, 7, 7.5, "#f4f4f4"), *cone(-11.5, 0, 2.6, 0.6, 0, 7, "#7c776c", k=4), *cone(10, 2, 2.4, 0.8, 0, 7.5, "#7c776c", k=4)], prio=2)
    add("zuma-rock", "NG", 9.1280, 7.2300, "Zuma Rock", "Zuma Rock", "Níger (estado), Nigéria", "Niger State, Nigeria", [
        R(0, 0, 18, 16, 0, 0.3, "#6f9a58"), C(0, 0, 7, 0.3, 3, "#8f8475", 11), C(0.3, 0.2, 6.4, 3, 7, "#958a7a", 11), C(0.6, 0.3, 5.6, 7, 10, "#8a7f71", 11),
        C(0.6, 0.4, 4.4, 10, 12, "#968b7c", 10), C(0.5, 0.5, 2.8, 12, 13, "#8f8475", 9)])
    add("mesquita-djenne", "ML", 13.9055, -4.5553, "Grande Mesquita de Djenné", "Great Mosque of Djenné", "Djenné, Mali", "Djenné, Mali", [
        R(0, 0, 18, 14, 0, 0.3, AREIA), R(0, 0, 16, 12, 0.3, 1.5, "#b98a5c"), R(0, 0, 14, 10, 1.5, 6, "#c49466"),
        *[R(x, -5.2, 1.6, 1.6, 1.5, 10, "#c49466") for x in (-4, 0, 4)], *[C(x, -5.2, 0.6, 10, 11.2, "#b98a5c", 6) for x in (-4, 0, 4)],
        *[R(x, -5.1, 0.6, 0.6, 1.5, 7.5, "#bd8d60") for x in (-6, -2, 2, 6)],
        *[R(x, -5.25, 0.15, 0.9, z, z + 0.15, "#7a5a3a") for x in (-4, 0, 4) for z in (4, 6, 8)]])
    add("renascimento-africano", "SN", 14.7222, -17.4950, "Monumento ao Renascimento Africano", "African Renaissance Monument", "Dacar, Senegal", "Dakar, Senegal", [
        C(0, 0, 8, 0, 3, "#7a8a5a", 10), C(0, 0, 5, 3, 6, "#8a8f6a", 9), R(0, 0, 2, 1.6, 6, 18, "#6e5a3e"), C(0, 0, 0.7, 18, 19.6, "#6e5a3e", 8),
        R(-1.6, 0.4, 1.4, 1.2, 6, 14, "#6e5a3e"), C(-2.2, 0.4, 0.5, 14, 15, "#6e5a3e", 8), R(1.4, 0, 0.8, 0.8, 15, 18, "#6e5a3e"), R(1.6, 0, 0.9, 0.9, 18, 21, "#6e5a3e")])
    baobas = []
    for x, y, h in ((-3.2, -8, 9), (3.2, -6, 10), (-3.2, -2, 8.5), (3.2, 1, 9.5), (-3.2, 5, 10), (3.2, 8, 8.5)):
        baobas += [C(x, y, 0.9, 0.2, h, "#8d7766", 8), C(x, y, 1.7, h, h + 0.6, "#4f7a3a", 8)]
    add("avenida-dos-baobas", "MG", -20.2508, 44.4183, "Avenida dos Baobás", "Avenue of the Baobabs", "Morondava, Madagascar", "Morondava, Madagascar", [
        R(0, 0, 14, 20, 0, 0.1, "#9fb36a"), R(0, 0, 2.4, 20, 0.1, 0.2, "#c7a77c"), *baobas])

    # Ásia
    muralha = []
    pts = [(-12, -4), (-6, 0), (-1, -3), (4, 1), (10, -2), (13, 3)]
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        ang = math.degrees(math.atan2(y2 - y1, x2 - x1))
        comp = math.hypot(x2 - x1, y2 - y1)
        muralha.append(P([ret_girado((x1 + x2) / 2, (y1 + y2) / 2, comp, 1.4, ang)], 0.4, 3.2, "#a89c86"))
    for px, py in pts:
        muralha += [R(px, py, 2.4, 2.4, 0.4, 5, "#9e927c"), R(px, py, 2.7, 2.7, 5, 5.6, "#7a6f5f")]
    add("grande-muralha", "CN", 40.4319, 116.5704, "Grande Muralha", "Great Wall", "Mutianyu, China", "Mutianyu, China", [R(0, 0, 30, 14, 0, 0.4, MATA), *muralha], prio=1)
    pagode = []
    for i in range(5):
        pagode += [R(-9, -8, 2 - 0.25 * i, 2 - 0.25 * i, i * 1.2, i * 1.2 + 0.8, "#b33b2e"), R(-9, -8, 2.7 - 0.25 * i, 2.7 - 0.25 * i, i * 1.2 + 0.8, i * 1.2 + 1.2, "#3c3a38")]
    add("monte-fuji", "JP", 35.3606, 138.7274, "Monte Fuji", "Mount Fuji", "Honshu, Japão", "Honshu, Japan", [
        *[C(0, 0, 12 * (1 - i / 11) + 1.2, i * 1.4, (i + 1) * 1.4, "#f4f6f8" if i >= 6 else ("#5f7c99" if i % 2 else "#58748f"), 14) for i in range(9)], *pagode], prio=1)
    add("n-seoul-tower", "KR", 37.5512, 126.9882, "N Seoul Tower", "N Seoul Tower", "Seul, Coreia do Sul", "Seoul, South Korea", [
        *montanha(0, 0, 7, 5, MATA, k=4, lados=10, achatar=0.4), C(0, 0, 0.9, 5, 18, "#e8e6e1", 8), C(0, 0, 1.8, 18, 20.5, "#9aa3ab", 10),
        C(0, 0, 1.5, 20.5, 21.5, "#e8e6e1", 10), C(0, 0, 0.5, 21.5, 25, "#e8e6e1", 6), C(0, 0, 0.25, 25, 28, "#d9534f", 6)])
    minaretes_f = []
    for x, y in ((-7, -7), (7, -7), (-7, 7), (7, 7)):
        minaretes_f += [C(x, y, 0.45, 0.3, 20, "#ece9e2", 8), *cone(x, y, 0.45, 0.05, 20, 23, "#d9d5cc", k=3, lados=8)]
    add("mesquita-faisal", "PK", 33.7295, 73.0372, "Mesquita Faisal", "Faisal Mosque", "Islamabad, Paquistão", "Islamabad, Pakistan", [
        R(0, 0, 18, 18, 0, 0.3, "#cfc9bc"), R(0, 0, 10, 10, 0.3, 2, "#e9e6df"), DEG(0, 0, 10, 5, 8, "#eeebe5", "#e3dfd7", 2), *minaretes_f])
    add("parlamento-bangladesh", "BD", 23.7626, 90.3786, "Parlamento (Jatiya Sangsad Bhaban)", "National Parliament House", "Daca, Bangladesh", "Dhaka, Bangladesh", [
        A(0, 0, 12, 12, 8.5, 8.5, 0, 0.25, AGUA, 24), O(0, 0, 8, 2.4, 0, 9, "#bdb5a6"),
        R(-6, 0, 3, 4, 0, 7.5, "#c4bcad"), R(6, 0, 3, 4, 0, 7.5, "#c4bcad"), R(0, -6, 4, 3, 0, 7.5, "#c4bcad"), R(0, 6, 4, 3, 0, 7.5, "#c4bcad"),
        *[C(x, y, 1.6, 0, 7, "#c9c1b2", 12) for x in (-4.6, 4.6) for y in (-4.6, 4.6)]])
    add("everest", "NP", 27.9881, 86.9250, "Monte Everest", "Mount Everest", "Himalaia, Nepal", "Himalayas, Nepal", [
        *[R(0.4 * i, 0.3 * i, 18 * (1 - i / 9), 16 * (1 - i / 9), i * 1.9, (i + 1) * 1.9,
            ["#6f6c66", "#6f6c66", "#7a7670", "#e9ecef", "#7a7670", "#f2f4f6", "#f2f4f6", "#e9ecef"][i]) for i in range(8)],
        *montanha(-7, 3, 4, 9, ["#6f6c66", "#7a7670", "#e9ecef", "#f2f4f6"], k=4, lados=8)], prio=2)
    add("sigiriya", "LK", 7.9570, 80.7603, "Sigiriya", "Sigiriya", "Matale, Sri Lanka", "Matale, Sri Lanka", [
        C(0, 0, 6.5, 0, 1, MATA, 10), R(0, -8, 10, 4, 0, 0.25, AGUA), C(0, 0, 4.5, 1, 12, "#9a6b4f", 10), C(0, 0, 4, 12, 12.6, "#6f9a58", 10),
        R(-0.8, -4.6, 1, 1.2, 1, 2.4, "#a07a5c"), R(0.8, -4.6, 1, 1.2, 1, 2.4, "#a07a5c")])
    add("shwedagon", "MM", 16.7983, 96.1496, "Pagode Shwedagon", "Shwedagon Pagoda", "Yangon, Mianmar", "Yangon, Myanmar", [
        R(0, 0, 14, 14, 0, 2, "#d9d0c0"), *cone(0, 0, 5, 1.6, 2, 9, "#d8a72e", k=5, lados=12), *cone(0, 0, 1.6, 0.15, 9, 17, "#e0b23a", k=6, lados=10),
        *[p for x in (-5.5, 5.5) for y in (-5.5, 5.5) for p in cone(x, y, 1, 0.15, 2, 5, "#d8a72e", k=3, lados=8)]])
    add("wat-arun", "TH", 13.7437, 100.4889, "Wat Arun", "Wat Arun", "Bangcoc, Tailândia", "Bangkok, Thailand", [
        R(0, -8.5, 18, 3, 0, 0.25, AGUA), DEG(0, 0, 12, 3, 4, "#e2dccf", "#d6cfc0", 0), *cone(0, 0, 2.6, 0.2, 4, 20, "#efe9dc", k=8, lados=8),
        *[p for x in (-4.6, 4.6) for y in (-4.6, 4.6) for p in cone(x, y, 1.1, 0.1, 1.3, 10, "#e8e1d2", k=5, lados=8)]])
    add("angkor-wat", "KH", 13.4125, 103.8670, "Angkor Wat", "Angkor Wat", "Siem Reap, Camboja", "Siem Reap, Cambodia", [
        P([[(-14, -12), (14, -12), (14, 12), (-14, 12)], [(-11, -9), (-11, 9), (11, 9), (11, -9)]], 0, 0.25, AGUA),
        R(0, 0, 18, 14, 0, 1.5, "#a59a84"), R(0, 0, 13, 10, 1.5, 3.5, "#9c917b"), R(0, 0, 8, 8, 3.5, 5.5, "#958a74"),
        *cone(0, 0, 1.8, 0.3, 5.5, 15, "#8f846e", k=6, lados=8), *[p for x in (-3.4, 3.4) for y in (-3.4, 3.4) for p in cone(x, y, 1.3, 0.2, 5.5, 12, "#8f846e", k=5, lados=8)],
        R(0, -10.5, 1.6, 5, 0, 0.4, "#a59a84")], prio=1)
    petronas = []
    for x in (-3, 3):
        petronas += [E(x, 0, 2.2, 1.75, 8, 0.3, 18, "#c9ced3"), E(x, 0, 2, 1.6, 8, 18, 24, "#c9ced3"), E(x, 0, 1.7, 1.35, 8, 24, 28, "#c9ced3"),
                     C(x, 0, 1.2, 28, 31, "#c9ced3", 10), C(x, 0, 0.8, 31, 33, "#c9ced3", 8), C(x, 0, 0.25, 33, 38, "#d9dde1", 6)]
    add("torres-petronas", "MY", 3.1579, 101.7116, "Torres Petronas", "Petronas Towers", "Kuala Lumpur, Malásia", "Kuala Lumpur, Malaysia", [
        R(0, 0, 14, 8, 0, 0.3, "#9ea39e"), *petronas, R(0, 0, 4, 0.8, 13, 14, "#9aa3ab")], prio=2)
    add("marina-bay-sands", "SG", 1.2834, 103.8607, "Marina Bay Sands", "Marina Bay Sands", "Singapura", "Singapore", [
        R(0, -5, 20, 4, 0, 0.25, AGUA), *[R(x, 0, 2.2, 5, 0, 18, "#c7ccd1") for x in (-5, 0, 5)], R(1.2, 0, 15.5, 2.4, 18, 19.2, "#8d969e")], escala=1.2)
    sinos = []
    for k in range(12):
        g = 2 * math.pi * k / 12
        sinos.append(C(3.9 * math.cos(g), 3.9 * math.sin(g), 0.35, 6, 6.9, "#7c7565", 6))
    add("borobudur", "ID", -7.6079, 110.2038, "Borobudur", "Borobudur", "Java Central, Indonésia", "Central Java, Indonesia", [
        R(0, 0, 22, 22, 0, 0.3, MATA), DEG(0, 0, 16, 5, 5, "#7c7565", "#857d6c", 0.3), C(0, 0, 4.4, 5.3, 6, "#857d6c", 16), *sinos,
        C(0, 0, 3.2, 6, 6.7, "#7c7565", 16), *cupula(0, 0, 1.8, 6.7, 1.8, "#7c7565", k=3), *cone(0, 0, 0.5, 0.1, 8.5, 10.5, "#7c7565", k=2, lados=6)], prio=2)
    add("bayterek", "KZ", 51.1283, 71.4305, "Bayterek", "Bayterek Tower", "Astana, Cazaquistão", "Astana, Kazakhstan", [
        R(0, 0, 14, 14, 0, 0.3, PRACA), C(0, 0, 2, 0.3, 2, "#e9e7e1", 8), C(0, 0, 1, 2, 14, "#e9e7e1", 8), C(0, 0, 1.8, 14, 15, "#e9e7e1", 10),
        C(0, 0, 2.4, 15, 16.3, "#e9e7e1", 10), *esfera(0, 0, 2, 18.2, "#e0b33a")])
    madrasas = [
        R(0, 0, 20, 14, 0, 0.3, "#d8c9a8"), R(-7, 1, 5, 9, 0.3, 6, "#c9ad84"), R(7, 1, 5, 9, 0.3, 6, "#c9ad84"), R(0, 6, 9, 4, 0.3, 6, "#c9ad84"),
        R(-4.8, 1, 0.8, 4.2, 0.3, 9, "#3a7fa8"), R(4.8, 1, 0.8, 4.2, 0.3, 9, "#3a7fa8"), R(0, 4, 4.2, 0.8, 0.3, 9, "#3a7fa8"),
        *[C(x, y, 0.5, 0.3, 11, "#c9ad84", 8) for x, y in ((-4.6, -3.4), (4.6, -3.4), (-4.6, 5.4), (4.6, 5.4))],
        *cupula(-7, 4, 1.6, 6, 1.8, "#2f8fb0", k=3), *cupula(7, 4, 1.6, 6, 1.8, "#2f8fb0", k=3), *cupula(0, 7, 2, 6, 2.4, "#2f8fb0", k=3)]
    add("registan", "UZ", 39.6547, 66.9757, "Registan", "Registan", "Samarcanda, Uzbequistão", "Samarkand, Uzbekistan", madrasas, prio=2)
    add("estatua-gengis-khan", "MN", 47.8079, 107.5298, "Estátua Equestre de Gêngis Khan", "Genghis Khan Equestrian Statue", "Tsonjin Boldog, Mongólia", "Tsonjin Boldog, Mongolia", [
        R(0, 0, 16, 16, 0, 0.3, "#8fae6e"), C(0, 0, 4, 0.3, 4, "#d8d5cf", 16),
        *[R(x, y, 0.5, 0.5, 4, 6, "#c4c9ce") for x in (-1.8, 1.8) for y in (-0.5, 0.5)], R(0, 0, 5, 1.6, 6, 8.2, "#c4c9ce"),
        R(2.6, 0, 1.2, 1, 8, 10.2, "#c4c9ce"), R(3.2, 0, 1.6, 0.9, 9.6, 10.6, "#c4c9ce"), R(-0.3, 0, 1.2, 1.2, 8.2, 11.6, "#c4c9ce"), C(-0.3, 0, 0.5, 11.6, 12.6, "#c4c9ce", 8)])
    t101 = [R(0, 0, 4.6, 4.6, 0.3, 8, "#5f8f88")]
    for i in range(8):
        zb = 8 + i * 3.4
        t101 += [R(0, 0, 3.6, 3.6, zb, zb + 1.2, "#5f8f88"), R(0, 0, 4.2, 4.2, zb + 1.2, zb + 3.4, "#6a9a93")]
    add("taipei-101", "TW", 25.0340, 121.5645, "Taipei 101", "Taipei 101", "Taipé, Taiwan", "Taipei, Taiwan", [
        R(0, 0, 10, 10, 0, 0.3, PRACA), *t101, R(0, 0, 2.6, 2.6, 35.2, 37, "#6a9a93"), C(0, 0, 0.35, 37, 43, "#c9ced3", 6)])
    chamas = [*montanha(0, 0, 8, 3, "#7a8a5a", k=3, lados=10, achatar=0.6)]
    for x, y, h in ((-3.6, 0, 18), (0, 1.8, 22), (3.6, 0, 18)):
        for k in range(7):
            chamas.append(R(x + 0.12 * k * (1 if x >= 0 else -1), y, 2.8 * (1 - k / 8), 2.4 * (1 - k / 9), 3 + h * k / 7, 3 + h * (k + 1) / 7, "#6c8aa3"))
    add("flame-towers", "AZ", 40.3594, 49.8266, "Flame Towers", "Flame Towers", "Baku, Azerbaijão", "Baku, Azerbaijan", chamas)
    add("pha-that-luang", "LA", 17.9763, 102.6334, "Pha That Luang", "Pha That Luang", "Vientiane, Laos", "Vientiane, Laos", [
        R(0, 0, 14, 14, 0, 1.6, "#d4b04a"), R(0, 0, 10, 10, 1.6, 3, "#d8b54e"),
        *[p for x in (-4, -2, 0, 2, 4) for y in (-4, 4) for p in cone(x, y, 0.4, 0.05, 3, 5.4, "#e0bd55", k=2, lados=6)],
        *[p for y in (-2, 0, 2) for x in (-4, 4) for p in cone(x, y, 0.4, 0.05, 3, 5.4, "#e0bd55", k=2, lados=6)],
        *cone(0, 0, 3.4, 0.2, 3, 14, "#e0bd55", k=6, lados=4)])
    ryugyong = [C(0, 0, 1.6, 32, 36, "#9aa5ae", 10)]
    for i in range(8):
        for j in range(3):
            ryugyong.append(P([braco(0, 0, 7 * (1 - i / 8.5), 2.6, 90 + 120 * j)], i * 4, (i + 1) * 4, "#a9b6c2" if i % 2 else "#b6c2cc"))
    add("hotel-ryugyong", "KP", 39.0367, 125.7308, "Hotel Ryugyong", "Ryugyong Hotel", "Pyongyang, Coreia do Norte", "Pyongyang, North Korea", ryugyong)

    # Oceania
    conchas = [R(0, 0, 22, 15, 0, 0.25, AGUA), R(0, 0, 16, 9, 0.25, 1.5, "#d9cdb8")]
    for y in (-1.8, 2):
        for xc, h in ((-4.5, 9), (-1.5, 7.5), (1.2, 5)):
            for k in range(6):
                conchas.append(R(xc - k * 0.3, y, 3.2 - k * 0.5, 2.6 - k * 0.25, 1.5 + k * h / 6, 1.5 + (k + 1) * h / 6, "#f4f1ea" if k % 2 else "#ece8df"))
    add("opera-de-sydney", "AU", -33.8568, 151.2153, "Ópera de Sydney", "Sydney Opera House", "Sydney, Austrália", "Sydney, Australia", conchas, prio=1)
    add("sky-tower", "NZ", -36.8485, 174.7622, "Sky Tower", "Sky Tower", "Auckland, Nova Zelândia", "Auckland, New Zealand", [
        R(0, 0, 12, 8, 0, 0.3, PRACA), C(0, 0, 1.8, 0.3, 3, "#cfcdc8", 8), C(0, 0, 1, 3, 18, "#d7d6d2", 8), C(0, 0, 2.2, 18, 20.5, "#9aa3ab", 12),
        C(0, 0, 1.8, 20.5, 22, "#d7d6d2", 12), C(0, 0, 0.6, 22, 26, "#d7d6d2", 6), C(0, 0, 0.25, 26, 31, "#d7d6d2", 6), R(4, 1, 4, 4, 0.3, 5, "#9aa3ab")])
    return M


# ---------- referências dos estados brasileiros (só aparecem com o estado selecionado) ----------
def estados():
    M = []

    def add(id_, uf, lat, lon, nome, cidade, pecas):
        M.append({"id": id_, "pais": "BR", "estado": "BR-" + uf, "nivel": "estado", "prio": 1, "lat": lat, "lon": lon,
                  "nome_pt": nome, "nome_en": nome, "lugar_pt": cidade + ", Brasil", "lugar_en": cidade + ", Brazil", "pecas": pecas})

    add("teatro-amazonas", "AM", -3.1303, -60.0234, "Teatro Amazonas", "Manaus", [
        R(0, -2, 16, 12, 0, 0.3, "#d8cfbf"), R(0, 1, 10, 8, 0.3, 6, "#e7b7b0"), R(0, -3.4, 6, 1.2, 0.3, 5.5, "#efe6dc"),
        *colunas([(-2.2, -4), (-0.75, -4), (0.75, -4), (2.2, -4)], 0.3, 0.3, 5.5, "#f4efe8"),
        C(0, 2, 2.4, 6, 7, "#e7b7b0", 12), *cupula(0, 2, 2.6, 7, 3, ["#2f8f4f", "#e6c229", "#2b5fa8", "#2f8f4f"], k=4), C(0, 2, 0.4, 10, 11, "#e6c229", 6)])
    add("ver-o-peso", "PA", -1.4525, -48.5033, "Mercado Ver-o-Peso", "Belém", [
        R(0, -5, 18, 3, 0, 0.25, AGUA), R(0, 0, 12, 6, 0, 4, "#7f9fb5"), R(0, 0, 11, 5, 4, 5, "#5d7f96"),
        *[p for x in (-5.6, 5.6) for y in (-2.6, 2.6) for p in [C(x, y, 0.8, 0, 6, "#7f9fb5", 8), *cone(x, y, 0.8, 0.1, 6, 8.5, "#4f6f86", k=3, lados=8)]],
        R(-4, -5.2, 2, 0.8, 0.25, 0.8, "#c0392b"), R(-1, -5.6, 2, 0.8, 0.25, 0.8, "#2b6cb0"), R(2.5, -5.1, 2, 0.8, 0.25, 0.8, "#e6c229")])
    add("elevador-lacerda", "BA", -12.9744, -38.5132, "Elevador Lacerda", "Salvador", [
        R(0, -6, 16, 4, 0, 0.25, AGUA), R(0, 4, 14, 6, 0, 9, "#7f8f5a"), R(0, -1, 2.2, 2.6, 0, 11, "#e9e1cf"), R(0, -1, 2.6, 3, 11, 12.4, "#e3d9c4"),
        R(0, 1.2, 1.6, 2.2, 9, 11, "#e3d9c4"), R(0, -3, 4, 2.4, 0, 3, "#e9e1cf"), R(-4, 3.5, 3, 2.5, 9, 11, "#d9c9a8"), R(4, 3.5, 3, 2.5, 9, 10.5, "#e8d3b5")])
    camara = [C(5, -0.5, 1.4 + 0.6 * k, 1.2 + 0.5 * k, 1.2 + 0.5 * (k + 1), "#f2f2ee", 16) for k in range(4)]
    add("congresso-nacional", "DF", -15.7997, -47.8641, "Congresso Nacional", "Brasília", [
        R(0, -7, 20, 6, 0, 0.25, GRAMA), R(0, 0, 20, 8, 0, 1.2, "#e6e3dc"), R(-0.7, 2.5, 1.2, 2.6, 1.2, 19, "#eeeeea"), R(0.7, 2.5, 1.2, 2.6, 1.2, 19, "#eeeeea"),
        R(0, 2.5, 0.4, 2.6, 9.5, 10.5, "#eeeeea"), *cupula(-5, -0.5, 2.6, 1.2, 1.8, "#f2f2ee", k=3, lados=16), *camara])
    add("jardim-botanico-curitiba", "PR", -25.4423, -49.2386, "Jardim Botânico", "Curitiba", [
        R(0, -3, 16, 12, 0, 0.3, GRAMA), *[R(x, -5.5, 3, 4, 0.3, 0.7, "#5f8a4e") for x in (-2.5, 2.5)], R(0, -7.8, 10, 0.8, 0.3, 0.5, "#c0392b"),
        R(0, 2, 5, 6, 0.3, 4, "#dbe8ec"), *cupula(0, 2.4, 2.2, 4, 2.2, "#e8f0f2", k=3), *cupula(0, -0.3, 1.6, 4, 1.4, "#e8f0f2", k=3), C(0, 2.4, 0.4, 6.2, 7.2, "#e8f0f2", 6)])
    corrente = []
    for sinal in (-1, 1):
        for k in range(1, 6):
            z = 14 - k * 2.1
            corrente.append(R(sinal * (6 - k * 1.2), 0, 1.3, 1.6, z - 0.8, z, "#c9ccd0"))
        for k in range(1, 5):
            z = 14 - k * 2.4
            corrente.append(R(sinal * (6 + k * 1.6), 0, 1.7, 1.6, z - 0.8, z, "#c9ccd0"))
    add("ponte-hercilio-luz", "SC", -27.5937, -48.5626, "Ponte Hercílio Luz", "Florianópolis", [
        R(0, 0, 30, 8, 0, 0.25, AGUA), R(0, 0, 28, 1.4, 3, 3.6, "#9fa3a6"), R(-6, 0, 1, 2, 0, 14, "#c9ccd0"), R(6, 0, 1, 2, 0, 14, "#c9ccd0"), *corrente,
        R(-13.5, 0, 2, 2.6, 0, 4, "#a7aaa8"), R(13.5, 0, 2, 2.6, 0, 4, "#a7aaa8")])
    add("forte-dos-reis-magos", "RN", -5.7563, -35.1950, "Forte dos Reis Magos", "Natal", [
        R(0, 0, 18, 16, 0, 0.25, AGUA), E(0, 0, 6, 3.6, 5, 0.25, 3, "#e8e2d2"), R(0, 0, 3, 3, 3, 4, "#d9d2c0"), R(0, 0, 3.2, 3.2, 4, 4.4, "#a8553f")])
    add("catedral-fortaleza", "CE", -3.7244, -38.5296, "Catedral Metropolitana", "Fortaleza", [
        R(0, 0, 12, 16, 0, 0.3, PRACA), R(0, 2, 6, 10, 0.3, 7, "#9aa1a6"), R(0, 2, 5, 10, 7, 8.4, "#7f878c"),
        R(-1.8, -3.6, 1.8, 1.8, 0.3, 13, "#9aa1a6"), R(1.8, -3.6, 1.8, 1.8, 0.3, 13, "#9aa1a6"), R(0, -3.6, 1.8, 1.4, 0.3, 9, "#9aa1a6"),
        *cone(-1.8, -3.6, 1, 0.1, 13, 19, "#8a9196", k=4, lados=8), *cone(1.8, -3.6, 1, 0.1, 13, 19, "#8a9196", k=4, lados=8)])
    add("palacio-dos-leoes", "MA", -2.5280, -44.3067, "Palácio dos Leões", "São Luís", [
        R(0, 6, 18, 3, 0, 0.25, AGUA), R(0, -1, 16, 12, 0, 0.3, PRACA), R(0, 0, 14, 6, 0.3, 5, "#f0ece2"), R(0, 0, 13.4, 5.4, 5, 6, "#a8553f"),
        R(0, -3.1, 12, 0.4, 1, 4.2, "#e3ddcf"), C(-2, -5, 0.5, 0.3, 1.5, "#d4c9b0", 8), C(2, -5, 0.5, 0.3, 1.5, "#d4c9b0", 8)])
    add("igreja-sao-francisco-ouro-preto", "MG", -20.3853, -43.5036, "Igreja de São Francisco de Assis", "Ouro Preto", [
        R(0, 0, 14, 14, 0, 0.3, "#6f9a58"), R(0, 1.5, 5, 8, 0.3, 6, "#f1ede4"), R(0, 1.5, 5.4, 8.4, 6, 7.2, "#9c5a43"), R(0, -2.6, 5, 0.4, 0.3, 8, "#f1ede4"),
        C(-2.2, -2.4, 1, 0.3, 8.6, "#f1ede4", 10), C(2.2, -2.4, 1, 0.3, 8.6, "#f1ede4", 10), C(-2.2, -2.4, 0.9, 8.6, 9.4, "#7d6a52", 10), C(2.2, -2.4, 0.9, 8.6, 9.4, "#7d6a52", 10),
        C(-2.2, -2.4, 0.4, 9.4, 10.2, "#7d6a52", 6), C(2.2, -2.4, 0.4, 9.4, 10.2, "#7d6a52", 6), R(0, -2.9, 1.2, 0.2, 0.3, 4, "#6f7a6e")])
    caixas = [R(0, 0, 14, 10, 0, 0.3, "#9ea39e")]
    for x, y in ((-3.5, -0.5), (0, 1.5), (3.5, -0.5)):
        caixas += [C(x, y, 0.5, 0.3, 7, "#9ea39e", 6), C(x, y, 2, 7, 11, "#b9bec1", 12), *cone(x, y, 2.1, 0.3, 11, 12.4, "#9ea39e", k=3, lados=12)]
    add("tres-caixas-dagua", "RO", -8.7620, -63.9030, "Três Caixas d'Água", "Porto Velho", caixas)
    add("monumento-aos-pioneiros", "RR", 2.8186, -60.6714, "Monumento aos Pioneiros", "Boa Vista", [
        R(0, -6, 14, 3, 0, 0.25, AGUA), R(0, 0, 14, 10, 0, 0.3, PRACA), R(0, 1, 10, 5, 0.3, 4, "#7b6f63"), R(0, 1, 9, 4.2, 4, 4.6, "#6f9a58"),
        *[R(x, -2.5, 0.8, 0.6, 0.3, 2, "#a3907b") for x in (-1.5, 0, 1.5)], R(0, -4, 5, 1, 0.3, 0.8, "#8a6a4a")])
    add("convento-da-penha", "ES", -20.3290, -40.2870, "Convento da Penha", "Vila Velha", [
        C(0, 0, 6, 0, 4, "#6f9a58", 10), C(0, 0.3, 3.6, 4, 9, "#8a8781", 9), C(0, 0.3, 3, 9, 10, "#7d7a74", 9),
        R(0, 0.3, 4.4, 3, 10, 13, "#f1ede4"), R(0, 0.3, 4.6, 3.2, 13, 13.8, "#a8553f"), R(-1.6, -0.9, 1.2, 1.2, 10, 15, "#f1ede4"), C(-1.6, -0.9, 0.6, 15, 16, "#a8553f", 8)])
    add("farol-cabo-branco", "PB", -7.1477, -34.7967, "Farol do Cabo Branco", "João Pessoa", [
        R(0, -4, 16, 6, 0, 0.25, AGUA), R(0, 2.5, 14, 6, 0, 2, "#c79b6b"), E(0, 1.5, 2.2, 0.8, 3, 2, 14, "#ece8df"),
        C(0, 1.5, 0.9, 14, 15.6, "#d34b3a", 8), C(0, 1.5, 1.1, 15.6, 16, "#ece8df", 8)])
    bastioes = [P([ret_girado(sx * 4.5, sy * 4.5, 3.6, 3.6, 45)], 0, 3.2, "#d8cdb4") for sx in (-1, 1) for sy in (-1, 1)]
    add("fortaleza-sao-jose-macapa", "AP", 0.0303, -51.0500, "Fortaleza de São José de Macapá", "Macapá", [
        R(0, -8, 16, 4, 0, 0.25, "#9fae9a"), R(0, 0, 14, 14, 0, 0.25, GRAMA), R(0, 0, 9, 9, 0.25, 3, "#d8cdb4"), *bastioes,
        R(0, 0, 5, 3, 3, 5, "#efe9dd"), R(0, 0, 5.2, 3.2, 5, 5.6, "#a8553f")])
    add("usina-do-gasometro", "RS", -30.0340, -51.2414, "Usina do Gasômetro", "Porto Alegre", [
        R(0, -5, 18, 4, 0, 0.25, AGUA), R(0, 1, 8, 5, 0, 6, "#b75b45"), R(0, 1, 7.6, 4.6, 6, 6.8, "#7f8a8f"),
        *cone(4.5, -1, 1.3, 0.75, 0, 26, "#b75b45", k=4, lados=10), C(4.5, -1, 0.9, 26, 26.8, "#8f4a38", 10)])
    return M


def main():
    caminho = os.path.join(RAIZ, "site", "data", "monumentos.json")
    lista = [dict(m) for m in ORIGINAIS] + paises()  # + estados()
    ids = [m["id"] for m in lista]
    assert len(ids) == len(set(ids)), "id repetido"
    saida = {
        "_comentario": "Gerado por ferramentas/gerar_monumentos.py (edite lá, não aqui). Maquetes 3D do globo em blocos próprios; formas e campos descritos no gerador.",
        "monumentos": lista,
    }
    with open(caminho, "w", encoding="utf-8") as f:
        f.write('{\n "_comentario": ' + json.dumps(saida["_comentario"], ensure_ascii=False) + ',\n "monumentos": [\n')
        f.write(",\n".join("  " + json.dumps(m, ensure_ascii=False, separators=(",", ":")) for m in lista))
        f.write("\n ]\n}\n")
    paises_com = sorted({m["pais"] for m in lista if m.get("nivel") != "estado"})
    estados_com = sorted({m["estado"] for m in lista if m.get("nivel") == "estado"})
    print(f"{len(lista)} monumentos · {len(paises_com)} países · {len(estados_com)} estados · {os.path.getsize(caminho) // 1024} KB")


if __name__ == "__main__":
    main()
