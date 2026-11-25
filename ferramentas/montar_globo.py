#!/usr/bin/env python3
"""Gera site/globo.js (protótipo em globo) a partir de site/app.js (mapa plano) e ferramentas/motor_globo.js.

Fica com tudo o que não é mapa (dados, painéis, rotas, idioma, tema) de app.js e troca só a parte do mapa
(a seção "mapa", entre os comentários "---------- mapa" e "---------- painel") pelo motor em MapLibre.
Rode depois de mudar app.js: python3 ferramentas/montar_globo.py
"""
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def troca(txt, velho, novo):
    assert txt.count(velho) == 1, f"trecho não encontrado (ou repetido) em app.js: {velho[:60]!r}"
    return txt.replace(velho, novo)


def main():
    s = open(os.path.join(RAIZ, "site", "app.js"), encoding="utf-8").read()
    motor = open(os.path.join(RAIZ, "ferramentas", "motor_globo.js"), encoding="utf-8").read()
    ini, fim = s.index("  /* ---------- mapa ---------- */"), s.index("  /* ---------- painel ---------- */")
    a, c = s[:ini], s[fim:]
    a = troca(a, "/* Raccoon Mundi · Mapa geopolítico\n * Site estático: lê os arquivos de site/data e site/geo e monta o mapa com Leaflet.",
              "/* Raccoon Mundi · Mapa geopolítico (protótipo em globo)\n"
              " * Mesmo site do mapa plano (app.js), com o mapa desenhado num globo pelo MapLibre GL JS.\n"
              " * Gerado por ferramentas/montar_globo.py a partir de app.js + ferramentas/motor_globo.js: edite esses, não este.")
    c = troca(c, "selecionar(null, false); mapa.flyTo([28, 15], 2, { duration: 0.6 }); }", "selecionar(null, false); voarInicio(); }")
    c = troca(c, "    criarHachura();\n    camadaDisputa.setStyle(estiloDisputa);\n    if (camadaGuerra) camadaGuerra.setStyle(estiloGuerra);\n    renderLegenda(); restyle();",
              "    atualizarCoresMapa();\n    renderLegenda(); restyle();")
    open(os.path.join(RAIZ, "site", "globo.js"), "w", encoding="utf-8").write(a + motor + c)
    print("site/globo.js gerado")


if __name__ == "__main__":
    main()
