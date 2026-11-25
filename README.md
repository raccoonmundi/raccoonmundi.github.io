# Mapa Raccoon Mundi

Mapa-múndi com as notícias recentes da **imprensa local** de cada região, para apoiar o Raccoon Mundi, o Substack de geopolítica.
Quem acessa clica numa macrorregião ou num país e vê o que os jornais de lá publicaram nas últimas 12, 24 ou 48 horas.

**Site:** https://raccoonmundi.github.io/

Links diretos para usar nos posts:
- macrorregião: `…/mapa-raccoon-mundi/#r=oriente-medio`
- país: `…/mapa-raccoon-mundi/#p=IR`
- tema em foco: `…/mapa-raccoon-mundi/#t=eua-ira`
- em português: acrescente `&l=pt` (ex.: `#p=IR&l=pt`)

## Como funciona

1. **Robô de coleta** (`robo/coletar.py`), rodando no GitHub Actions: lê os arquivos que o [GDELT](https://www.gdeltproject.org) publica a cada 15 minutos (Global Knowledge Graph, em inglês e traduzido de 65 idiomas). Descobre o país de cada veículo pelo domínio (.ir, .br…) ou pela tabela de veículos por país do GDELT, e fica só com matérias de temas geopolíticos. Depois marca a mídia estatal e os temas em foco e traduz os títulos para inglês e português com o [Argos Translate](https://pypi.org/project/argostranslate/).
   - O robô não usa a API de busca do GDELT: ela limita pedidos por endereço de rede, e os servidores do GitHub são compartilhados. No teste de 25/11/2026, quase todos os pedidos foram recusados.
2. **Dados** (`site/data/`):
   - `noticias.json`: gravado pelo robô a cada coleta.
   - `temas.json`: temas em foco, atualizados pela rodada do Raccoon Mundi.
   - `paises.json` e `macrorregioes.json`: fixos, gerados por `ferramentas/preparar_geo.py`.
3. **Site** (`site/`): página estática com [Leaflet](https://leafletjs.com) e fronteiras do [Natural Earth](https://www.naturalearthdata.com), publicada no GitHub Pages.

## Rodar a coleta à mão

Na aba **Actions**, abra **Atualizar mapa** e clique em **Run workflow**. Para coletar só alguns países, informe os códigos (ex.: `US,BR,IR`).
O resultado de cada execução (países, quantidade de notícias, idiomas e traduções) aparece no resumo da execução.

O workflow também roda sozinho quando algo muda em `site/` ou `robo/`. A coleta 2x por dia entra na Fase 1: basta tirar o `#` das linhas `schedule` em `.github/workflows/atualizar.yml`.

## Ajustes comuns

| O que mudar | Onde |
| --- | --- |
| Passar da fase de teste (10 países) para todos | `robo/config.json`: `"modo": "completo"` |
| Lista de mídia estatal ou sites bloqueados | `robo/config.json`: `midia_estatal`, `bloqueio` |
| Temas geopolíticos do GDELT que contam | `robo/config.json`: `temas_fortes` (valem 2 pontos) e `temas_gerais` (1 ponto) |
| Temas em foco | `site/data/temas.json` (a rodada do Raccoon Mundi mantém). Cada tema lista países e grupos de nomes: a matéria precisa citar ao menos um nome de cada grupo |
| Macrorregiões | `ferramentas/preparar_geo.py`; depois, rodar o script de novo e o mapshaper (abaixo) |

## Regerar os dados geográficos

```bash
python ferramentas/preparar_geo.py
npx mapshaper -i /tmp/geo_paises_full.geojson -simplify 40% keep-shapes -clean -o site/geo/paises.geojson precision=0.001 format=geojson
npx mapshaper -i /tmp/geo_paises_full.geojson -filter 'r != null' -simplify 40% keep-shapes -clean -dissolve r -o site/geo/macrorregioes.geojson precision=0.001 format=geojson
npx mapshaper -i /tmp/geo_disputadas_full.geojson -simplify 60% keep-shapes -o site/geo/disputadas.geojson precision=0.001 format=geojson
```

## Regras editoriais

- O mapa mostra só título, veículo, horário e link. O texto das matérias nunca é copiado.
- A mídia estatal aparece com selo.
- A cor do mapa mede o volume de notícias, nunca gravidade ou lado.
- As fronteiras seguem o padrão oficial do Natural Earth (situação de fato), com as áreas disputadas hachuradas.
- A coleta é automática e não é checada item a item. O rodapé do site avisa isso.

Mapa: Raccoon Mundi, com dados do Natural Earth e do GDELT.
