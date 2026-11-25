#!/usr/bin/env python3
"""
Robô de coleta do Mapa Raccoon Mundi.

Lê os arquivos que o GDELT publica a cada 15 minutos (Global Knowledge Graph 2.1:
fluxo em inglês e fluxo traduzido de 65 idiomas) e monta, para cada país, a lista
das matérias recentes da imprensa sediada nele.

Por que arquivos e não a API de busca: a API limita os pedidos por endereço de rede,
e os servidores do GitHub são compartilhados com muita gente. No teste de 25/11/2026
quase todos os pedidos voltaram com "limite de requisições". Os arquivos não têm esse limite.

Passos:
  1. baixa os arquivos de 15 minutos desde a última execução (no máximo ~13 h);
  2. descobre o país de cada veículo: pelo domínio nacional (.ir, .br, .ua...) ou pela
     tabela do GDELT "news outlets by country 2015–2021";
  3. fica só com matérias com temas geopolíticos (conflito, sanções, eleições...);
  4. marca mídia estatal e os temas em foco (site/data/temas.json);
  5. traduz os títulos para inglês e português com o Argos Translate (offline, sem chave);
  6. grava site/data/noticias.json com 48 h de histórico.

Uso:
  python robo/coletar.py                 # países do modo definido em robo/config.json
  python robo/coletar.py --paises US,BR  # só esses países (códigos ISO)
  python robo/coletar.py --todos         # todos os países
  python robo/coletar.py --sem-traducao  # pula a tradução (teste rápido)
"""
import argparse
import concurrent.futures as cf
import csv
import datetime as dt
import hashlib
import html
import io
import json
import os
import re
import urllib.parse
import sys
import time
import zipfile

import requests

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS = os.path.join(RAIZ, "site", "data")
BASE = "http://data.gdeltproject.org/gdeltv2/"
USER_AGENT = "mapa-raccoon-mundi/1.0 (+https://github.com/raccoonmundi/raccoonmundi.github.io)"
TABELA_URL = "https://blog.gdeltproject.org/wp-content/uploads/2021-news-outlets-by-countrycode-2015-2021.csv"
TABELA_ARQ = os.path.join(os.path.expanduser("~"), ".cache", "mapa-raccoon-mundi", "outlets-by-country.csv")

# código ISO 639-2 usado pelo GDELT -> (nome do idioma, código do Argos Translate)
IDIOMAS = {
    "eng": ("English", "en"), "spa": ("Spanish", "es"), "por": ("Portuguese", "pt"), "fra": ("French", "fr"),
    "deu": ("German", "de"), "ita": ("Italian", "it"), "rus": ("Russian", "ru"), "ukr": ("Ukrainian", "uk"),
    "zho": ("Chinese", "zh"), "jpn": ("Japanese", "ja"), "kor": ("Korean", "ko"), "ara": ("Arabic", "ar"),
    "fas": ("Persian", "fa"), "heb": ("Hebrew", "he"), "tur": ("Turkish", "tr"), "hin": ("Hindi", "hi"),
    "urd": ("Urdu", "ur"), "ben": ("Bengali", "bn"), "ind": ("Indonesian", "id"), "msa": ("Malay", "ms"),
    "vie": ("Vietnamese", "vi"), "tha": ("Thai", "th"), "pol": ("Polish", "pl"), "nld": ("Dutch", "nl"),
    "swe": ("Swedish", "sv"), "dan": ("Danish", "da"), "fin": ("Finnish", "fi"), "nor": ("Norwegian", "nb"),
    "ces": ("Czech", "cs"), "slk": ("Slovak", "sk"), "hun": ("Hungarian", "hu"), "ron": ("Romanian", "ro"),
    "bul": ("Bulgarian", "bg"), "ell": ("Greek", "el"), "srp": ("Serbian", "sr"), "hrv": ("Croatian", "hr"),
    "sqi": ("Albanian", "sq"), "aze": ("Azerbaijani", "az"), "est": ("Estonian", "et"), "lav": ("Latvian", "lv"),
    "lit": ("Lithuanian", "lt"), "slv": ("Slovenian", "sl"), "cat": ("Catalan", "ca"), "tgl": ("Tagalog", "tl"),
    "swa": ("Swahili", "sw"), "kat": ("Georgian", "ka"), "hye": ("Armenian", "hy"), "kaz": ("Kazakh", "kk"),
    "mon": ("Mongolian", "mn"), "mkd": ("Macedonian", "mk"), "bos": ("Bosnian", "bs"), "glg": ("Galician", "gl"),
    "eus": ("Basque", "eu"), "afr": ("Afrikaans", "af"), "amh": ("Amharic", "am"), "som": ("Somali", "so"),
    "hau": ("Hausa", "ha"), "pus": ("Pashto", "ps"), "tam": ("Tamil", "ta"), "tel": ("Telugu", "te"),
    "mar": ("Marathi", "mr"), "guj": ("Gujarati", "gu"), "pan": ("Punjabi", "pa"), "mal": ("Malayalam", "ml"),
    "kan": ("Kannada", "kn"), "sin": ("Sinhala", "si"), "nep": ("Nepali", "ne"), "khm": ("Khmer", "km"),
    "lao": ("Lao", "lo"), "mya": ("Burmese", "my"), "uzb": ("Uzbek", "uz"), "tuk": ("Turkmen", "tk"),
    "kir": ("Kyrgyz", "ky"), "tgk": ("Tajik", "tg"), "bel": ("Belarusian", "be"), "isl": ("Icelandic", "is"),
    "mlt": ("Maltese", "mt"), "gle": ("Irish", "ga"), "cym": ("Welsh", "cy"),
}
# domínios nacionais usados por sites do mundo todo: não indicam o país do veículo
CCTLD_GENERICOS = {"tv", "io", "co", "me", "ai", "fm", "cc", "ws", "to", "gg", "nu", "sh", "st", "vc", "pw",
                   "ac", "cx", "la", "im", "eu", "su", "tk", "ml", "ga", "cf", "gq"}
RE_TITULO = re.compile(r"<PAGE_TITLE>(.*?)</PAGE_TITLE>", re.S)
RE_SEPARADOR = re.compile(r"(\s+[|—–-]\s+|\s*:\s+)")
TRAD_VERSAO = 3  # mude para refazer todas as traduções


def limpar_titulo(titulo, dominio):
    """Tira do fim do título o nome do site ou da editoria ("... — DSnews.ua", "... | Reuters", "... - Mundo")."""
    rotulos = dominio.split(".")
    raiz = rotulos[-2] if len(rotulos) >= 2 else rotulos[0]
    if len(rotulos) >= 3 and len(raiz) <= 3:  # ex.: bbc.co.uk, folha.com.br
        raiz = rotulos[-3]
    for _ in range(2):
        partes = re.split(r"\s+[|—–-]\s+", titulo)
        if len(partes) < 2:
            break
        ultimo = partes[-1].strip()
        if (raiz.lower() in ultimo.lower().replace(" ", "") and len(ultimo.split()) <= 4) or len(ultimo.split()) == 1:
            titulo = re.sub(r"\s+[|—–-]\s+" + re.escape(ultimo) + r"\s*$", "", titulo).strip()
        else:
            break
    return titulo


def agora():
    return dt.datetime.now(dt.timezone.utc)


def iso_utc(d):
    return d.strftime("%Y-%m-%dT%H:%M:%SZ")


def ler_iso(s):
    return dt.datetime.strptime(s, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc)


def ler_carimbo(c):
    return dt.datetime.strptime(c, "%Y%m%d%H%M%S").replace(tzinfo=dt.timezone.utc)


def carregar(nome, padrao):
    caminho = os.path.join(DADOS, nome)
    if not os.path.exists(caminho):
        return padrao
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def baixar(url, timeout=120):
    r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=timeout)
    return r


# ---------------------------------------------------------------- país do veículo
class PaisDoVeiculo:
    """Domínio do veículo -> país (código ISO do mapa)."""

    def __init__(self, paises, log, correcoes=None):
        self.iso_validos = set(paises)
        self.correcoes = {k: v for k, v in (correcoes or {}).items() if not k.startswith("_")}
        self.fips_para_iso = {}
        for iso, p in paises.items():
            for f in p.get("fips", []):
                self.fips_para_iso.setdefault(f, iso)
        self.tabela = self._carregar_tabela(log)
        self.memo = {}

    def _carregar_tabela(self, log):
        if not os.path.exists(TABELA_ARQ):
            os.makedirs(os.path.dirname(TABELA_ARQ), exist_ok=True)
            log("baixando a tabela de veículos por país do GDELT")
            r = baixar(TABELA_URL)
            r.raise_for_status()
            with open(TABELA_ARQ, "wb") as f:
                f.write(r.content)
        melhor = {}
        with open(TABELA_ARQ, encoding="utf-8", errors="replace") as f:
            for linha in csv.reader(f):
                if len(linha) < 3:
                    continue
                try:
                    cnt = int(linha[2])
                except ValueError:
                    continue  # cabeçalho
                dom, fips = linha[0].lower().strip(), linha[1].upper().strip()
                if dom not in melhor or cnt > melhor[dom][1]:
                    melhor[dom] = (fips, cnt)
        log(f"tabela de veículos: {len(melhor)} domínios")
        return {d: self.fips_para_iso.get(v[0]) for d, v in melhor.items()}

    def __call__(self, dominio):
        if dominio in self.memo:
            return self.memo[dominio]
        partes = dominio.split(".")
        for i in range(len(partes) - 1):  # correções manuais valem primeiro (null = ignorar o veículo)
            sufixo = ".".join(partes[i:])
            if sufixo in self.correcoes:
                self.memo[dominio] = self.correcoes[sufixo]
                return self.memo[dominio]
        iso = None
        tld = dominio.rsplit(".", 1)[-1]
        if len(tld) == 2 and tld not in CCTLD_GENERICOS:
            cand = "GB" if tld == "uk" else tld.upper()
            if cand in self.iso_validos:
                iso = cand
        if not iso:
            for i in range(len(partes) - 1):
                iso = self.tabela.get(".".join(partes[i:]))
                if iso:
                    break
        self.memo[dominio] = iso
        return iso


# ---------------------------------------------------------------- arquivos do GDELT
class FontesConhecidas:
    """Lista de veículos conhecidos por país (robo/fontes.json). Casa pelo endereço da matéria; o domínio
    mais específico vence (piaui.folha.uol.com.br antes de folha.uol.com.br antes de uol.com.br)."""
    def __init__(self, dados):
        self.lista = sorted(((dom, iso, v if isinstance(v, str) else v["nome"], None if isinstance(v, str) else v.get("uf"))
                             for iso, d in dados.items() if not iso.startswith("_") for dom, v in d.items()),
                            key=lambda x: -len(x[0]))
        self.paises = {x[1] for x in self.lista}
        self.memo = {}

    def __call__(self, host):
        """(país, nome do veículo, sigla do estado se for jornal regional) ou None."""
        if host not in self.memo:
            self.memo[host] = next(((iso, nome, uf) for dom, iso, nome, uf in self.lista if host == dom or host.endswith("." + dom)), None)
        return self.memo[host]


def host_da_url(url):
    try:
        h = (urllib.parse.urlsplit(url).hostname or "").lower()
    except ValueError:
        h = ""
    return h.removeprefix("www.")


def casa(lista, *dominios):
    return any(d and (d == e or d.endswith("." + e)) for d in dominios for e in lista)


def ultimo_carimbo(traduzido):
    r = baixar(BASE + ("lastupdate-translation.txt" if traduzido else "lastupdate.txt"), timeout=60)
    r.raise_for_status()
    for linha in r.text.splitlines():
        m = re.search(r"/(\d{14})\.(?:translation\.)?gkg\.csv\.zip", linha)
        if m:
            return m.group(1)
    raise RuntimeError("não achei o último arquivo GKG em lastupdate")


def carimbos_desde(ultimo, desde):
    t = ler_carimbo(ultimo)
    out = []
    while t > desde:
        out.append(t.strftime("%Y%m%d%H%M%S"))
        t -= dt.timedelta(minutes=15)
    return out


def baixar_gkg(pedido):
    carimbo, traduzido = pedido
    nome = f"{carimbo}.{'translation.' if traduzido else ''}gkg.csv.zip"
    for tentativa in range(3):
        try:
            r = baixar(BASE + nome)
            if r.status_code == 404:
                return carimbo, traduzido, None
            r.raise_for_status()
            with zipfile.ZipFile(io.BytesIO(r.content)) as z:
                return carimbo, traduzido, z.read(z.namelist()[0]).decode("utf-8", errors="replace")
        except Exception:  # noqa: BLE001
            time.sleep(5 * (tentativa + 1))
    return carimbo, traduzido, None


def nomes_do_registro(c):
    """Pessoas, organizações, lugares e nomes citados (o GDELT já os traduz para o inglês)."""
    partes = [c[11], c[13]]
    partes += [loc.split("#")[1] for loc in c[9].split(";") if loc.count("#") > 1]
    partes += [n.rsplit(",", 1)[0] for n in c[23].split(";") if n]
    return " | ".join(partes).lower()


# ---------------------------------------------------------------- níveis
# 1 = Mundo: a matéria envolve outro país e tem tema geopolítico.
# 2 = País: o que acontece no país e pode afetá-lo (política, economia, segurança nacionais).
# 3 = Estado: notícia local, com estado identificado. Só nos países do piloto (config "nivel3_paises"),
#     no idioma original e sem exigir tema geopolítico.
NIVEIS_VERSAO = 4
# temas que indicam política nacional (o "LEADER" do GDELT pega até prefeito, por isso não entra)
TEMAS_NACIONAIS = {"TAX_FNCACT_PRESIDENT", "TAX_FNCACT_MINISTER", "TAX_FNCACT_SENATOR", "TAX_FNCACT_LAWMAKER",
                   "TAX_FNCACT_CONGRESSMAN", "TAX_FNCACT_PRIME_MINISTER"}
RE_UF_URL = re.compile(r"^/([a-z]{2})/")


def locais_do_registro(c):
    """Lugares citados na matéria: (código do país FIPS, código ADM1 do estado)."""
    out = []
    for loc in c[9].split(";"):
        p = loc.split("#")
        if len(p) > 4 and p[2]:
            out.append((p[2], p[3]))
    return out


class Estados:
    """Estados dos países do piloto (site/data/estados.json): código ADM1 do GDELT e sigla -> id (BR-MA)."""
    def __init__(self, dados):
        self.por_fips, self.por_uf = {}, {}
        for iso, lst in dados.items():
            if iso.startswith("_"):
                continue
            for e in lst:
                self.por_fips[e["fips"]] = e["id"]
                self.por_uf[(iso, e["uf"].lower())] = e["id"]

    def da_url(self, iso, host, url):
        """g1.globo.com/ma/maranhao/... -> BR-MA (as seções regionais do G1 trazem a sigla do estado)."""
        if host != "g1.globo.com":
            return None
        try:
            m = RE_UF_URL.match(urllib.parse.urlsplit(url).path)
        except ValueError:
            return None
        return self.por_uf.get((iso, m.group(1))) if m else None


def classificar(iso, temas_reg, pontos, locs, proprios, estados, piloto, estado_url, uf_veiculo):
    """Devolve (nível, estado) ou (None, None) para descartar."""
    # o GDELT às vezes acha um lugar estrangeiro por engano: o outro país precisa pesar na matéria
    # (3 menções ou ao menos tantas quanto as do próprio país)
    fora = sum(1 for cc, _ in locs if cc not in proprios)
    dentro = len(locs) - fora
    if pontos >= 2 and (fora >= 3 or (fora >= 1 and fora >= dentro)):
        return 1, None
    if iso in piloto:
        ufs = {estados.por_fips.get(a) for cc, a in locs if cc in proprios and a and a != cc} - {None}
        # o estado precisa aparecer na matéria: sem lugar citado, notícia de portal regional (novela, celebridade) não é local
        estado = estado_url or (next(iter(ufs)) if len(ufs) == 1 else None) or (uf_veiculo if uf_veiculo in ufs else None)
        if estado_url:  # a própria redação pôs a matéria na seção do estado (G1 regional)
            return 3, estado_url
        nacional = bool(temas_reg & TEMAS_NACIONAIS) or (estado and estado.endswith("-DF") and pontos >= 2)
        if estado and not nacional:  # menção estrangeira de passagem não tira a notícia do estado
            return 3, estado
    if pontos >= 1:
        return 2, None
    return None, None


# ---------------------------------------------------------------- temas em foco
def preparar_temas(temas):
    prontos = []
    for tm in temas:
        if tm.get("ativo") is False:
            continue
        # cada nome casa no começo de palavra: "iran" pega "iranian", mas não "piranha"
        grupos = [[re.compile(r"(?<!\w)" + re.escape(t.lower())) for t in g] for g in tm.get("nomes", []) if g]
        if grupos:
            prontos.append({"id": tm["id"], "paises": set(tm.get("paises", [])), "grupos": grupos,
                            "temas_gdelt": set(tm.get("temas_gdelt", []))})
    return prontos


def conferir_temas_pelo_titulo(itens, prontos):
    """O título (traduzido ou original) precisa citar ao menos um dos lados do tema.
    Temas novos ou alterados pela rodada valem para o histórico se o título citar todos os lados."""
    por_id = {tm["id"]: tm for tm in prontos}
    for it in itens:
        texto = ((it.get("titulo_en") or "") + " | " + it["titulo_original"]).lower()
        mantidos = []
        for tm in prontos:
            if (tm["paises"] and it["pais"] not in tm["paises"]) or it.get("pontos", 1) < 2:
                continue
            lados = [any(t.search(texto) for t in g) for g in tm["grupos"]]
            if (tm["id"] in it["temas"] and any(lados)) or all(lados):
                mantidos.append(tm["id"])
        it["temas"] = [t for t in mantidos if t in por_id]


def temas_do_registro(iso, texto, temas_reg, prontos, pontos):
    out = []
    if pontos < 2:  # tema em foco exige matéria claramente geopolítica
        return out
    for tm in prontos:
        if tm["paises"] and iso not in tm["paises"]:
            continue
        if temas_reg is not None and tm["temas_gdelt"] and not (tm["temas_gdelt"] & temas_reg):
            continue
        if all(any(t.search(texto) for t in g) for g in tm["grupos"]):
            out.append(tm["id"])
    return out


# ---------------------------------------------------------------- áreas em guerra ou disputadas
def preparar_areas(areas):
    """Cada área tem uma lista de lugares; a matéria entra na área se citar um deles."""
    return [{"id": a["id"], "nomes": [re.compile(r"(?<!\w)" + re.escape(n.lower())) for n in a.get("nomes", [])]}
            for a in areas if a.get("nomes")]


def areas_do_texto(texto, prontas):
    return [a["id"] for a in prontas if any(n.search(texto) for n in a["nomes"])]


def conferir_areas_pelo_titulo(itens, prontas):
    """Depois da tradução, a área só fica se o título (em inglês ou original) citar um dos lugares."""
    por_id = {a["id"]: a for a in prontas}
    for it in itens:
        texto = ((it.get("titulo_en") or "") + " | " + it["titulo_original"]).lower()
        it["areas"] = [a for a in it.get("areas", []) if a in por_id and any(n.search(texto) for n in por_id[a]["nomes"])]


# ---------------------------------------------------------------- tradução
def traduzir(itens, anteriores, log):
    for it in itens:
        if it.get("tv") != TRAD_VERSAO:  # tradução de uma versão antiga: refaz
            it["titulo_en"] = it["titulo_pt"] = None
    for it in itens:  # reaproveita as traduções já feitas
        p = anteriores.get(it["id"])
        if p and p.get("tv") == TRAD_VERSAO:
            it["titulo_en"] = it.get("titulo_en") or p.get("titulo_en")
            it["titulo_pt"] = it.get("titulo_pt") or p.get("titulo_pt")
        if it.get("lc") == "en":
            it["titulo_en"] = it["titulo_original"]
        if it.get("lc") == "pt":
            it["titulo_pt"] = it["titulo_original"]
    pendentes = [it for it in itens if not (it.get("titulo_en") and it.get("titulo_pt"))]
    if not pendentes:
        return {}
    try:
        import argostranslate.package as pacote
        import argostranslate.translate as tradutor
    except ImportError:
        log("Argos Translate não instalado: os títulos ficam no idioma original.")
        return {"erro": "argos ausente"}
    pacote.update_package_index()
    disponiveis = pacote.get_available_packages()
    instalados = {(p.from_code, p.to_code) for p in pacote.get_installed_packages()}
    falhas = set()

    def garantir(de, para):
        if (de, para) in instalados:
            return True
        if (de, para) in falhas:
            return False
        pk = next((p for p in disponiveis if p.from_code == de and p.to_code == para), None)
        if not pk:
            falhas.add((de, para))
            return False
        try:
            log(f"  instalando modelo {de}->{para}")
            pacote.install_from_path(pk.download())
            instalados.add((de, para))
            return True
        except Exception as e:  # noqa: BLE001
            log(f"  não consegui instalar {de}->{para}: {e}")
            falhas.add((de, para))
            return False

    destino_pt = "pb" if any(p.from_code == "en" and p.to_code == "pb" for p in disponiveis) else "pt"

    def tr(texto, de, para):
        # traduz cada trecho separado por ":" ou travessão: o Argos às vezes descarta o que vem depois deles
        try:
            pedacos = RE_SEPARADOR.split(texto)
            saida = []
            for i, p in enumerate(pedacos):
                if i % 2 or not re.search(r"\w", p):
                    saida.append(p)
                    continue
                trad = tradutor.translate(p, de, para).strip()
                if i < len(pedacos) - 1 or not p.rstrip().endswith((".", "!", "?")):
                    trad = trad.rstrip(".:;")  # o Argos acrescenta ponto final que o título não tem
                saida.append(trad)
            return "".join(saida).strip() or None
        except Exception as e:  # noqa: BLE001
            log(f"  falha ao traduzir ({de}->{para}): {e}")
            return None

    cont = {"en": 0, "pt": 0, "sem_modelo": {}}
    for it in itens:
        it["tv"] = TRAD_VERSAO
    for it in pendentes:
        lc = it.get("lc")
        if not it.get("titulo_en") and lc and lc != "en":
            if garantir(lc, "en"):
                it["titulo_en"] = tr(it["titulo_original"], lc, "en")
                cont["en"] += bool(it["titulo_en"])
            else:
                cont["sem_modelo"][it["idioma"]] = cont["sem_modelo"].get(it["idioma"], 0) + 1
        if not it.get("titulo_pt") and it.get("titulo_en") and garantir("en", destino_pt):
            it["titulo_pt"] = tr(it["titulo_en"], "en", destino_pt)
            cont["pt"] += bool(it["titulo_pt"])
    return cont


# ---------------------------------------------------------------- principal
def chave_titulo(t):
    return re.sub(r"[^\w]+", " ", t.lower()).strip()[:90]


def resumo_markdown(saida, extra, segundos):
    linhas = [f"## Coleta de {saida['gerado_em']} ({'teste' if saida['teste'] else 'completa'})", "",
              f"{extra['arquivos']} arquivos de 15 min lidos ({extra['registros']} matérias no GDELT), "
              f"{len(saida['itens'])} matérias no mapa, {segundos:.0f} s.", "",
              "| País | Candidatas (48 h) | Volume 24 h | No mapa | Nível 1 / 2 / 3 (estados) | Idiomas | Veículos mais frequentes | Veículos da lista vistos | Mais frequentes fora da lista (nesta execução) |",
              "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for iso, r in sorted(saida["relatorio"].items()):
        nv = r.get("niveis", {})
        linhas.append(f"| {iso} | {r['candidatas']} | {saida['volume'].get(iso, 0)} | {r['no_mapa']} | "
                      f"{nv.get('1', 0)} / {nv.get('2', 0)} / {nv.get('3', 0)} ({r.get('estados', 0)}) | {', '.join(r['idiomas'])} | {', '.join(r['veiculos'])} | {r.get('fontes_vistas', '')} | {', '.join(r.get('fora_da_lista', []))} |")
    linhas += ["", "**Temas em foco:** " + (", ".join(f"{k}: {v}" for k, v in extra["temas"].items()) or "nenhuma matéria")]
    linhas += ["", "**Áreas em guerra ou disputadas:** " + (", ".join(f"{k}: {v}" for k, v in extra.get("areas", {}).items()) or "nenhuma matéria")]
    if extra.get("traducao"):
        linhas += ["", f"**Tradução:** {json.dumps(extra['traducao'], ensure_ascii=False)}"]
    return "\n".join(linhas) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--paises", help="códigos ISO separados por vírgula")
    ap.add_argument("--todos", action="store_true")
    ap.add_argument("--sem-traducao", action="store_true")
    args = ap.parse_args()

    def log(m):
        print(m, flush=True)

    inicio = time.time()
    cfg = json.load(open(os.path.join(RAIZ, "robo", "config.json"), encoding="utf-8"))
    paises = carregar("paises.json", {})
    temas = preparar_temas(carregar("temas.json", []))
    areas = preparar_areas(carregar("areas.json", []))
    anterior = carregar("noticias.json", {})
    anteriores = {i["id"]: i for i in anterior.get("itens", [])}

    if args.paises:
        alvo = {p.strip().upper() for p in args.paises.split(",") if p.strip()}
    elif args.todos or cfg.get("modo") == "completo":
        alvo = {k for k, v in paises.items() if v.get("r") and "ver" not in v}
    else:
        alvo = set(cfg["paises_teste"])
    teste = bool(args.paises) or not (args.todos or cfg.get("modo") == "completo")

    fortes, gerais = set(cfg["temas_fortes"]), set(cfg["temas_gerais"])
    bloqueio = cfg["bloqueio"] + cfg.get("agregadores", [])
    estatal, exilio = cfg["midia_estatal"], cfg.get("midia_exilio", [])
    pais_de = PaisDoVeiculo(paises, log, cfg.get("veiculo_pais"))
    fontes = FontesConhecidas(json.load(open(os.path.join(RAIZ, "robo", "fontes.json"), encoding="utf-8")))
    estrito = bool(cfg.get("somente_fontes_conhecidas"))
    if estrito and alvo - fontes.paises:
        log(f"Sem lista de veículos conhecidos (nada entra no mapa): {', '.join(sorted(alvo - fontes.paises))}")
    fora_da_lista, da_lista = {}, {}  # para o relatório: o que o GDELT viu de cada país
    estados = Estados(carregar("estados.json", {}))
    piloto = set(cfg.get("nivel3_paises", []))
    proprios_de = {iso: set(v.get("fips") or [iso]) for iso, v in paises.items()}  # códigos FIPS, como nos lugares do GDELT

    # 1. quais arquivos de 15 minutos ler
    t_agora = agora()
    desde = t_agora - dt.timedelta(hours=cfg["horas_por_execucao_max"])
    mesma_regra = (bool(anterior.get("somente_fontes_conhecidas", False)) == estrito
                   and anterior.get("niveis_versao") == NIVEIS_VERSAO)
    if not mesma_regra:
        anteriores = {}
    if anterior.get("ultimo_arquivo") and set(anterior.get("paises_coletados", [])) >= alvo and mesma_regra:
        desde = max(desde, ler_carimbo(anterior["ultimo_arquivo"]))
    pedidos, ultimo = [], None
    for traduzido in (False, True):
        u = ultimo_carimbo(traduzido)
        ultimo = max(ultimo or u, u)
        pedidos += [(c, traduzido) for c in carimbos_desde(u, desde)]
    log(f"{len(pedidos)} arquivos de 15 min para ler (desde {iso_utc(desde)})")

    # 2. lê os arquivos e separa as matérias geopolíticas da imprensa de cada país
    candidatas, contagem, n_registros, n_arquivos = {}, {}, 0, 0
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        for carimbo, traduzido, texto in ex.map(baixar_gkg, pedidos):
            if texto is None:
                continue
            n_arquivos += 1
            quando = iso_utc(ler_carimbo(carimbo))
            cont_arq = contagem.setdefault(carimbo, {})
            for linha in texto.splitlines():
                c = linha.split("\t")
                if len(c) < 27 or c[2] != "1":
                    continue
                n_registros += 1
                dominio = c[3].lower().strip().removeprefix("www.")
                url = c[4].strip()
                if not url.startswith(("http://", "https://")):
                    continue
                host = host_da_url(url) or dominio
                if casa(bloqueio, dominio, host):
                    continue
                fonte = fontes(host)
                iso = fonte[0] if (estrito and fonte) else pais_de(dominio)
                if iso not in alvo:
                    continue
                temas_reg = {t.split(",")[0] for t in c[7].split(";") if t}
                pontos = 2 * len(temas_reg & fortes) + len(temas_reg & gerais)
                if pontos == 0 and iso not in piloto:  # nos países do piloto, notícia local entra sem tema geopolítico
                    continue
                if estrito and not fonte:  # veículo fora da lista: só entra no relatório
                    if pontos:
                        f = fora_da_lista.setdefault(iso, {})
                        f[dominio] = f.get(dominio, 0) + 1
                    continue
                nivel, estado = classificar(iso, temas_reg, pontos, locais_do_registro(c), proprios_de.get(iso, {iso}),
                                            estados, piloto, estados.da_url(iso, host, url),
                                            estados.por_uf.get((iso, (fonte[2] or "").lower())) if fonte and fonte[2] else None)
                if nivel is None:
                    continue
                if fonte:
                    f = da_lista.setdefault(iso, {})
                    f[fonte[1]] = f.get(fonte[1], 0) + 1
                if nivel <= 2:  # o volume (cor do mapa) conta só os níveis 1 e 2
                    cont_arq[iso] = cont_arq.get(iso, 0) + 1
                m = RE_TITULO.search(c[26])
                titulo = limpar_titulo(re.sub(r"\s+", " ", html.unescape(m.group(1))).strip(), dominio) if m else ""
                if len(titulo) < 12:
                    continue
                lang3 = "eng"
                if traduzido:
                    mm = re.search(r"srclc:(\w+)", c[25])
                    lang3 = mm.group(1) if mm else "?"
                nome_idioma, lc = IDIOMAS.get(lang3, (lang3, None))
                id_ = hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]
                if id_ in candidatas:
                    continue
                texto_nomes = titulo.lower() + " | " + nomes_do_registro(c)
                candidatas[id_] = {
                    "id": id_, "pais": iso, "titulo_original": titulo, "titulo_en": None, "titulo_pt": None,
                    "veiculo": dominio, "veiculo_nome": fonte[1] if fonte else None,
                    "idioma": nome_idioma, "lc": lc, "visto_em": quando, "url": url,
                    "midia_estatal": casa(estatal, dominio, host),
                    "midia_exilio": casa(exilio, dominio, host),
                    "temas": temas_do_registro(iso, texto_nomes, temas_reg, temas, pontos) if nivel <= 2 else [],
                    "areas": areas_do_texto(texto_nomes, areas) if pontos >= 2 and nivel <= 2 else [],
                    "pontos": pontos, "nivel": nivel, "estado": estado,
                }

    # 3. junta com as matérias das execuções anteriores (até 48 h) e escolhe as de cada país
    limite = t_agora - dt.timedelta(hours=cfg["janela_horas"])
    for id_, it in anteriores.items():
        if it["pais"] not in alvo or id_ in candidatas or ler_iso(it["visto_em"]) < limite:
            continue
        dom = it["veiculo"]
        host = host_da_url(it["url"]) or dom
        fonte = fontes(host)
        if estrito:
            if not fonte or fonte[0] != it["pais"]:
                continue  # a lista de veículos vale também para o histórico
        elif pais_de(dom) != it["pais"]:
            continue  # correções de país valem também para o histórico
        if casa(bloqueio, dom, host):
            continue
        candidatas[id_] = dict(it, titulo_original=limpar_titulo(it["titulo_original"], dom), midia_estatal=casa(estatal, dom, host),
                               midia_exilio=casa(exilio, dom, host), areas=it.get("areas", []),
                               veiculo_nome=fonte[1] if fonte else None)
        candidatas[id_].pop("extra_area", None)
    por_pais = {}
    for it in candidatas.values():
        if ler_iso(it["visto_em"]) >= limite:
            por_pais.setdefault(it["pais"], []).append(it)
    itens, relatorio = [], {}
    for iso in sorted(alvo):
        lst = sorted(por_pais.get(iso, []), key=lambda x: x["visto_em"], reverse=True)
        vistos, escolhidos = set(), []
        for nivel, limite_n in ((1, cfg.get("max_nivel1_por_pais", 8)), (2, cfg.get("max_nivel2_por_pais", 10))):
            n = 0
            for minimo in (3, 2, 1):  # primeiro as mais geopolíticas; completa com as demais
                for it in lst:
                    k = chave_titulo(it["titulo_original"])
                    if it.get("nivel", 2) == nivel and it.get("pontos", 1) >= minimo and k not in vistos and n < limite_n:
                        vistos.add(k)
                        escolhidos.append(it)
                        n += 1
        if iso in piloto:  # nível 3: as mais recentes de cada estado
            por_estado = {}
            for it in lst:
                if it.get("nivel") == 3 and it.get("estado"):
                    por_estado.setdefault(it["estado"], []).append(it)
            for est, its in por_estado.items():
                n = 0
                for it in its:
                    k = chave_titulo(it["titulo_original"])
                    if k not in vistos and n < cfg.get("max_por_estado", 8):
                        vistos.add(k)
                        escolhidos.append(it)
                        n += 1
        ids = {i["id"] for i in escolhidos}
        extras_tema = [it for it in lst if it["temas"] and it.get("nivel", 2) <= 2 and it["id"] not in ids
                       and chave_titulo(it["titulo_original"]) not in vistos][: cfg["max_tema_por_pais"]]
        escolhidos += extras_tema
        itens += escolhidos
        veic = {}
        for it in lst:
            v = it.get("veiculo_nome") or it["veiculo"]
            veic[v] = veic.get(v, 0) + 1
        relatorio[iso] = {"candidatas": len(lst), "no_mapa": len(escolhidos),
                          "idiomas": sorted({i["idioma"] for i in escolhidos}),
                          "veiculos": [v for v, _ in sorted(veic.items(), key=lambda x: -x[1])[:4]],
                          "fontes_vistas": len(da_lista.get(iso, {})),
                          "niveis": {str(n): sum(1 for i in escolhidos if i.get("nivel", 2) == n) for n in (1, 2, 3)},
                          "estados": len({i.get("estado") for i in escolhidos if i.get("nivel") == 3}),
                          "fora_da_lista": [f"{d} ({n})" for d, n in sorted(fora_da_lista.get(iso, {}).items(), key=lambda x: -x[1])[:6]]}

    # 3b. notícias sobre as áreas em guerra ou disputadas, de qualquer país coletado (além do limite por país)
    no_mapa = {i["id"] for i in itens}
    for ar in areas:
        lst = sorted((it for it in candidatas.values() if ar["id"] in it.get("areas", []) and ler_iso(it["visto_em"]) >= limite),
                     key=lambda x: x["visto_em"], reverse=True)
        vistos = {chave_titulo(i["titulo_original"]) for i in itens if ar["id"] in i.get("areas", [])}
        for it in lst:
            if len(vistos) >= cfg.get("max_por_area", 10):
                break
            k = chave_titulo(it["titulo_original"])
            if k in vistos:
                continue
            vistos.add(k)
            if it["id"] not in no_mapa:
                it["extra_area"] = True
                itens.append(it)
                no_mapa.add(it["id"])

    # 4. volume das últimas 24 h: soma das contagens por arquivo de 15 min, guardadas entre execuções
    contagens = {k: v for k, v in (anterior.get("contagens", {}) if mesma_regra else {}).items()
                 if ler_carimbo(k) >= t_agora - dt.timedelta(hours=24)}  # regra de fontes nova: o volume recomeça
    contagens.update({k: v for k, v in contagem.items() if ler_carimbo(k) >= t_agora - dt.timedelta(hours=24)})
    volume = {iso: 0 for iso in alvo}
    for v in contagens.values():
        for iso, n in v.items():
            if iso in volume:
                volume[iso] += n

    temas_rel = {}
    for it in itens:
        for t in it["temas"]:
            temas_rel[t] = temas_rel.get(t, 0) + 1

    trad = {}
    if not args.sem_traducao:
        log("Traduzindo títulos")
        trad = traduzir([i for i in itens if i.get("nivel") != 3], anteriores, log)

    conferir_temas_pelo_titulo(itens, temas)
    conferir_areas_pelo_titulo(itens, areas)
    itens = [i for i in itens if not (i.get("extra_area") and not i["areas"])]  # entrou só pela área e o título não a cita
    areas_rel = {}
    for it in itens:
        it.pop("extra_area", None)
        for a in it["areas"]:
            areas_rel[a] = areas_rel.get(a, 0) + 1
    temas_rel = {}
    for it in itens:
        for t in it["temas"]:
            temas_rel[t] = temas_rel.get(t, 0) + 1

    itens.sort(key=lambda x: x["visto_em"], reverse=True)
    saida = {
        "gerado_em": iso_utc(agora()),
        "teste": teste,
        "somente_fontes_conhecidas": estrito,
        "niveis_versao": NIVEIS_VERSAO,
        "janela_h": cfg["janela_horas"],
        "ultimo_arquivo": ultimo,
        "paises_coletados": sorted(alvo),
        "volume": volume,
        "relatorio": relatorio,
        "contagens": contagens,
        "itens": itens,
    }
    extra = {"arquivos": n_arquivos, "registros": n_registros, "temas": temas_rel, "areas": areas_rel, "traducao": trad}
    md = resumo_markdown(saida, extra, time.time() - inicio)
    if n_arquivos or anteriores:  # sem arquivo novo, regrava o histórico com as correções atuais
        with open(os.path.join(DADOS, "noticias.json"), "w", encoding="utf-8") as f:
            json.dump(saida, f, ensure_ascii=False, separators=(",", ":"))
    if not n_arquivos:
        md = "**Nenhum arquivo novo do GDELT nesta execução: só o histórico foi reprocessado.**\n\n" + md
        print("::warning::Nenhum arquivo do GDELT foi lido; dados anteriores mantidos.")
    print(md)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(md)
    return 0


if __name__ == "__main__":
    sys.exit(main())
