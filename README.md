# Mapa Raccoon Mundi

Mapa-múndi com as notícias recentes da **imprensa local** de cada região, para apoiar o Raccoon Mundi, o Substack de geopolítica.
Quem acessa clica numa macrorregião ou num país e vê o que os jornais de lá publicaram nas últimas 12, 24 ou 48 horas.

**Site:** https://raccoonmundi.github.io/ · protótipo em globo: https://raccoonmundi.github.io/globo.html

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

## Protótipo em globo

`site/globo.html` mostra o mesmo mapa num globo (MapLibre GL JS 6, em `site/vendor/maplibre/`, com as fontes dos nomes em `site/fonts/`).
`site/globo.js` é gerado: tudo o que não é mapa vem de `site/app.js` e a parte do mapa vem de `ferramentas/motor_globo.js`.
Depois de mudar qualquer um dos dois, rode `python3 ferramentas/montar_globo.py`.
No globo, a seleção sobe em 3D e a câmera inclina; `globo.html?3d=0` volta ao destaque plano (sombra, área erguida e contorno).
Monumentos 3D em estilo maquete (blocos próprios, sem modelos de terceiros): `site/data/monumentos.json` é gerado por `python3 ferramentas/gerar_monumentos.py` (edite o gerador). A referência de cada país aparece a partir do zoom de país ou com o país selecionado; as referências dos estados brasileiros, só com o estado selecionado. Maquetes vizinhas que encavalariam ficam só com a mais conhecida (ou a da seleção). `globo.html?monumentos=0` desliga.

## Quase em tempo real

O workflow roda a cada 15 minutos (2 min depois de cada arquivo novo do GDELT, em :02, :17, :32 e :47). Quem mantém o ritmo é o **revezamento** (`robo/revezar.py`, job `revezar`): no fim de cada rodada ele espera o próximo horário e dispara a rodada seguinte. Foi preciso porque o agendador do GitHub (`on: schedule`) não disparou nenhuma vez neste repositório; o `cron` ficou só de reserva, de hora em hora, para religar o revezamento se ele parar. Qualquer push ou rodada manual também religa.

- **Parar:** cancele a rodada em andamento na aba Actions (rodada cancelada não passa o bastão) ou desative o workflow.
- **Nunca dois revezamentos:** antes de disparar, a rodada confere se há outra mais nova na fila ou em andamento; se houver, é ela quem passa o bastão.

Entre as rodadas, o histórico do robô fica no cache do GitHub Actions (`robo/estado.py`); os dados vão para o repositório quando a execução vem de um push ou é manual, e uma vez por dia nas rodadas automáticas (quando o último registro tem 23 h ou mais). A página confere `data/noticias.json` a cada 5 minutos e se atualiza sem recarregar.
