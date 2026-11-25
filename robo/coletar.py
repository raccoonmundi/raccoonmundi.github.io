#!/usr/bin/env python3
"""
Robô de coleta do Mapa Raccoon Mundi.

Para cada país, consulta a API DOC 2.0 do GDELT filtrando pelo país do veículo
(sourcecountry = imprensa sediada ali) e por temas geopolíticos. Depois:
  1. remove duplicatas e sites bloqueados, marca mídia estatal;
  2. consulta cada tema em foco (site/data/temas.json) na imprensa dos países envolvidos;
  3. traduz os títulos para inglês e português com o Argos Translate (offline, sem chave);
  4. grava site/data/noticias.json, que o site lê.

Uso:
  python robo/coletar.py                 # países do modo definido em robo/config.json
  python robo/coletar.py --paises US,BR  # só esses países (códigos ISO)
  python robo/coletar.py --todos         # todos os países com código no GDELT
  python robo/coletar.py --sem-traducao  # pula a tradução (teste rápido)

Mesmo padrão do script de geocodificação do mapa de SP: consultar com pausa,
tentar de novo quando a API pede para esperar e reaproveitar o que já foi feito
(aqui, as traduções da execução anterior).
"""
import argparse
import datetime as dt
import hashlib
import html
import json
import os
import re
import sys
import time

import requests

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS = os.path.join(RAIZ, "site", "data")
GDELT = "https://api.gdeltproject.org/api/v2/doc/doc"
USER_AGENT = "mapa-raccoon-mundi/1.0 (+https://github.com/KaueMB23/mapa-raccoon-mundi)"

# Nome do idioma no GDELT -> código usado pelo Argos Translate
IDIOMAS = {
    "English": "en", "Spanish": "es", "Portuguese": "pt", "French": "fr", "German": "de", "Italian": "it",
    "Russian": "ru", "Ukrainian": "uk", "Chinese": "zh", "Japanese": "ja", "Korean": "ko", "Arabic": "ar",
    "Persian": "fa", "Hebrew": "he", "Turkish": "tr", "Hindi": "hi", "Urdu": "ur", "Bengali": "bn",
    "Indonesian": "id", "Malay": "ms", "Vietnamese": "vi", "Thai": "th", "Polish": "pl", "Dutch": "nl",
    "Swedish": "sv", "Danish": "da", "Finnish": "fi", "Norwegian": "nb", "Czech": "cs", "Slovak": "sk",
    "Hungarian": "hu", "Romanian": "ro", "Bulgarian": "bg", "Greek": "el", "Serbian": "sr", "Croatian": "hr",
    "Albanian": "sq", "Azerbaijani": "az", "Estonian": "et", "Latvian": "lv", "Lithuanian": "lt",
    "Slovenian": "sl", "Catalan": "ca", "Tagalog": "tl", "Swahili": "sw", "Irish": "ga", "Galician": "gl",
    "Basque": "eu", "Esperanto": "eo", "Kyrgyz": "ky",
}


def agora():
    return dt.datetime.now(dt.timezone.utc)


def iso_utc(d):
    return d.strftime("%Y-%m-%dT%H:%M:%SZ")


def carregar(nome, padrao):
    caminho = os.path.join(DADOS, nome)
    if not os.path.exists(caminho):
        return padrao
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


class Coletor:
    def __init__(self, cfg, log):
        self.cfg = cfg
        self.log = log
        self.sessao = requests.Session()
        self.sessao.headers.update({"User-Agent": USER_AGENT})
        self.ultima = 0.0

    def consultar(self, query, janela=None, maxrecords=None):
        """Lista de artigos, [] se não houver nenhum, ou None se a consulta falhar."""
        params = {"query": query, "mode": "artlist", "format": "json", "sort": "datedesc",
                  "maxrecords": maxrecords or self.cfg["maxrecords"], "timespan": janela or self.cfg["janela"]}
        pausa = self.cfg["pausa_segundos"]
        for tentativa in range(4):
            espera = pausa * (1 + 2 * tentativa) - (time.time() - self.ultima)
            if espera > 0:
                time.sleep(espera)
            self.ultima = time.time()
            try:
                r = self.sessao.get(GDELT, params=params, timeout=60)
            except requests.RequestException as e:
                self.log(f"    erro de rede: {e}")
                continue
            texto = r.text.strip()
            if r.status_code == 429 or "limit requests" in texto.lower():
                self.log("    o GDELT pediu para esperar")
                continue
            if r.status_code >= 500:
                self.log(f"    GDELT respondeu {r.status_code}")
                continue
            if r.status_code != 200:
                self.log(f"    GDELT respondeu {r.status_code}: {texto[:150]}")
                return None
            if not texto:
                return []
            try:
                dados = json.loads(texto, strict=False)
            except ValueError:
                # o GDELT devolve erros de consulta como texto simples
                self.log(f"    resposta não-JSON: {texto[:200]}")
                return None
            return dados.get("articles") or []
        return None


def eh_estatal(dominio, cfg):
    return any(dominio == d or dominio.endswith("." + d) for d in cfg["midia_estatal"])


def bloqueado(dominio, cfg):
    return any(dominio == d or dominio.endswith("." + d) for d in cfg["bloqueio"])


def para_item(a, iso, cfg):
    url = a.get("url") or ""
    if not url.startswith(("http://", "https://")):
        return None
    dominio = (a.get("domain") or "").lower()
    if bloqueado(dominio, cfg):
        return None
    titulo = re.sub(r"\s+", " ", html.unescape(a.get("title") or "")).strip()
    if len(titulo) < 8:
        return None
    try:
        visto = dt.datetime.strptime(a.get("seendate", ""), "%Y%m%dT%H%M%SZ").replace(tzinfo=dt.timezone.utc)
    except ValueError:
        return None
    idioma = a.get("language") or ""
    return {
        "id": hashlib.sha1(url.encode("utf-8")).hexdigest()[:12],
        "pais": iso,
        "titulo_original": titulo,
        "titulo_en": None,
        "titulo_pt": None,
        "veiculo": dominio,
        "idioma": idioma,
        "lc": IDIOMAS.get(idioma.split(" ")[0]),
        "visto_em": iso_utc(visto),
        "url": url,
        "midia_estatal": eh_estatal(dominio, cfg),
        "temas": [],
    }


def chave_titulo(t):
    return re.sub(r"[^\w]+", " ", t.lower()).strip()[:90]


def sourcecountry(fips):
    if len(fips) == 1:
        return f"sourcecountry:{fips[0]}"
    return "(" + " OR ".join(f"sourcecountry:{f}" for f in fips) + ")"


def coletar_pais(col, iso, info, cfg, teste):
    """Retorna (itens, volume_24h, relatorio) ou None se a consulta falhar."""
    q = f"{sourcecountry(info['fips'])} {cfg['filtro_geopolitica']}"
    arts = col.consultar(q)
    if arts is None:
        return None
    limite_24h = agora() - dt.timedelta(hours=24)
    vistos, itens, vol = set(), [], 0
    for a in arts:
        it = para_item(a, iso, cfg)
        if not it:
            continue
        if dt.datetime.strptime(it["visto_em"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=dt.timezone.utc) >= limite_24h:
            vol += 1
        k = chave_titulo(it["titulo_original"])
        if k in vistos:
            continue
        vistos.add(k)
        itens.append(it)
    itens.sort(key=lambda x: x["visto_em"], reverse=True)
    itens = itens[: cfg["max_por_pais"]]
    rel = {"encontrados": len(arts), "mantidos": len(itens), "volume_24h": vol,
           "idiomas": sorted({i["idioma"] for i in itens if i["idioma"]})}
    if teste:  # calibra o filtro: quanto o GDELT tem do país sem o filtro de temas
        sem_filtro = col.consultar(sourcecountry(info["fips"]), janela="24h", maxrecords=250)
        rel["sem_filtro_24h"] = None if sem_filtro is None else len(sem_filtro)
    return itens, vol, rel


def coletar_temas(col, temas, paises, cfg, itens_por_id, log):
    rel = {}
    for tm in temas:
        if tm.get("ativo") is False or not tm.get("consulta"):
            continue
        total = 0
        for iso in tm.get("paises", []):
            info = paises.get(iso)
            if not info or not info.get("fips"):
                continue
            arts = col.consultar(f"{tm['consulta']} {sourcecountry(info['fips'])}", maxrecords=25)
            if arts is None:
                log(f"  tema {tm['id']} / {iso}: falhou")
                continue
            n = 0
            for a in arts:
                it = para_item(a, iso, cfg)
                if not it:
                    continue
                atual = itens_por_id.setdefault(it["id"], it)
                if tm["id"] not in atual["temas"]:
                    atual["temas"].append(tm["id"])
                n += 1
                if n >= 8:
                    break
            total += n
            log(f"  tema {tm['id']} / {iso}: {n} matérias")
        rel[tm["id"]] = total
    return rel


def traduzir(itens, anteriores, log):
    for it in itens:  # reaproveita as traduções da execução anterior
        p = anteriores.get(it["id"])
        if p:
            it["titulo_en"] = it["titulo_en"] or p.get("titulo_en")
            it["titulo_pt"] = it["titulo_pt"] or p.get("titulo_pt")
        if it.get("lc") == "en":
            it["titulo_en"] = it["titulo_original"]
        if it.get("lc") == "pt":
            it["titulo_pt"] = it["titulo_original"]
    pendentes = [it for it in itens if not (it["titulo_en"] and it["titulo_pt"])]
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
        try:
            saida = tradutor.translate(texto, de, para)
            return saida.strip() or None
        except Exception as e:  # noqa: BLE001
            log(f"  falha ao traduzir ({de}->{para}): {e}")
            return None

    cont = {"en": 0, "pt": 0, "sem_modelo": {}}
    for it in pendentes:
        lc = it.get("lc")
        if not it["titulo_en"] and lc and lc != "en":
            if garantir(lc, "en"):
                it["titulo_en"] = tr(it["titulo_original"], lc, "en")
                cont["en"] += bool(it["titulo_en"])
            else:
                cont["sem_modelo"][it["idioma"] or "?"] = cont["sem_modelo"].get(it["idioma"] or "?", 0) + 1
        if not it["titulo_pt"] and it["titulo_en"] and garantir("en", destino_pt):
            it["titulo_pt"] = tr(it["titulo_en"], "en", destino_pt)
            cont["pt"] += bool(it["titulo_pt"])
    return cont


def resumo_markdown(saida, rel_temas, rel_trad, segundos):
    linhas = [f"## Coleta de {saida['gerado_em']} ({'teste' if saida['teste'] else 'completa'})", "",
              f"{len(saida['itens'])} matérias, {len(saida['paises_coletados'])} países com coleta, {segundos:.0f} s.", "",
              "| País | Status | Encontradas (filtro) | Mantidas | Volume 24 h | Sem filtro 24 h | Idiomas |",
              "| --- | --- | --- | --- | --- | --- | --- |"]
    for iso, r in sorted(saida["relatorio"].items()):
        linhas.append(f"| {iso} | {'falhou' if r.get('erro') else 'ok'} | {r.get('encontrados', '')} | {r.get('mantidos', '')} | "
                      f"{r.get('volume_24h', '')} | {r.get('sem_filtro_24h', '')} | {', '.join(r.get('idiomas', []))} |")
    if rel_temas:
        linhas += ["", "**Temas em foco:** " + ", ".join(f"{k}: {v}" for k, v in rel_temas.items())]
    if rel_trad:
        linhas += ["", f"**Tradução:** {json.dumps(rel_trad, ensure_ascii=False)}"]
    return "\n".join(linhas) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--paises", help="códigos ISO separados por vírgula")
    ap.add_argument("--todos", action="store_true")
    ap.add_argument("--sem-traducao", action="store_true")
    args = ap.parse_args()

    inicio = time.time()
    cfg = json.load(open(os.path.join(RAIZ, "robo", "config.json"), encoding="utf-8"))
    paises = carregar("paises.json", {})
    temas = carregar("temas.json", [])
    anterior = carregar("noticias.json", {})
    anteriores = {i["id"]: i for i in anterior.get("itens", [])}

    if args.paises:
        alvo = [p.strip().upper() for p in args.paises.split(",") if p.strip()]
    elif args.todos or cfg.get("modo") == "completo":
        alvo = sorted(k for k, v in paises.items() if v.get("fips") and v.get("r"))
    else:
        alvo = cfg["paises_teste"]
    teste = not (args.todos or cfg.get("modo") == "completo") or bool(args.paises)

    def log(m):
        print(m, flush=True)

    col = Coletor(cfg, log)
    itens_por_id, volume, relatorio, coletados = {}, {}, {}, []
    for iso in alvo:
        info = paises.get(iso)
        if not info or not info.get("fips"):
            log(f"{iso}: sem código FIPS, ignorado")
            continue
        log(f"{iso} ({info['nome_pt']})")
        res = coletar_pais(col, iso, info, cfg, teste)
        if res is None:
            relatorio[iso] = {"erro": True}
            # mantém o que havia da execução anterior para não apagar o país do mapa
            velhos = [i for i in anteriores.values() if i["pais"] == iso]
            for i in velhos:
                itens_por_id.setdefault(i["id"], dict(i, temas=[]))
            if velhos:
                coletados.append(iso)
                volume[iso] = anterior.get("volume", {}).get(iso, 0)
            continue
        its, vol, rel = res
        for i in its:
            itens_por_id.setdefault(i["id"], i)
        volume[iso] = vol
        relatorio[iso] = rel
        coletados.append(iso)
        log(f"  {rel['mantidos']} mantidas, {vol} nas últimas 24 h")

    log("Temas em foco")
    rel_temas = coletar_temas(col, temas, paises, cfg, itens_por_id, log)

    itens = sorted(itens_por_id.values(), key=lambda x: x["visto_em"], reverse=True)
    rel_trad = {}
    if not args.sem_traducao:
        log("Traduzindo títulos")
        rel_trad = traduzir(itens, anteriores, log)

    saida = {
        "gerado_em": iso_utc(agora()),
        "teste": teste,
        "janela_h": int(cfg["janela"].rstrip("h")),
        "paises_coletados": sorted(coletados),
        "volume": volume,
        "relatorio": relatorio,
        "temas_relatorio": rel_temas,
        "itens": [{k: v for k, v in i.items() if k != "lc"} for i in itens],
    }
    with open(os.path.join(DADOS, "noticias.json"), "w", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, separators=(",", ":"))

    md = resumo_markdown(saida, rel_temas, rel_trad, time.time() - inicio)
    print(md)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(md)
    # falha a execução só se nenhum país foi coletado (aí o site mantém a versão anterior)
    return 0 if coletados else 1


if __name__ == "__main__":
    sys.exit(main())
