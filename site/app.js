/* Raccoon Mundi · Mapa geopolítico
 * Site estático: lê os arquivos de site/data e site/geo e monta o mapa com Leaflet.
 * Dois níveis de clique (macrorregião e país), temas em foco, botão EN/PT e links próprios (#r=, #p=, #t=).
 */
(function () {
  'use strict';

  var T = {
    en: {
      mapa: 'MAP', titulo: 'The world through its local press', irPara: 'Go to', escolha: 'Go to…',
      regioes: 'Regions', paises: 'Countries', mundo: 'World', regiao: 'Region', pais: 'Country',
      tema: 'In focus', emFoco: 'IN FOCUS', ultimas: 'Latest from the local press',
      noticias: function (n) { return n === 1 ? '1 story' : num(n) + ' stories'; },
      dePaises: function (m) { return m === 1 ? 'from 1 country' : 'from ' + m + ' countries'; },
      periodo: function (h) { return 'last ' + h + ' h'; },
      voltar: function (nome) { return '← ' + nome; },
      paisesDaRegiao: 'Countries', regioesMaisAtivas: 'Most active regions', destaques: 'Latest stories',
      semNoticias: 'No stories from the local press in this period.',
      semColeta: 'This country is not collected yet in the test phase.',
      semFonte: 'GDELT has no source code for this territory.',
      ver: 'No separate collection for this territory. See ',
      abrir: 'Open story ↗', lerTraduzido: 'Read translated', traduzir: 'Translate', estatal: 'State media', exilio: 'Media in exile', original: 'Original',
      atualizado: function (t) { return 'Updated ' + t + ' (Brasília time).'; },
      aindaNao: 'The first collection has not run yet.',
      teste: function (n) { return 'Test phase: ' + n + ' countries collected.'; },
      aviso: 'Automatic collection (GDELT), not checked item by item. Headlines are machine-translated.',
      avisoFontes: 'Only well-known outlets from each country, from a reviewed list. Automatic collection (GDELT), not checked item by item. Headlines are machine-translated.',
      fronteiras: 'Borders: Natural Earth (de facto status); disputed areas are hatched.',
      creditos: 'Map: Raccoon Mundi, with data from ',
      legTitulo: 'Geopolitical stories, last 24 h', menos: 'fewer', mais: 'more',
      legSem: 'No stories', legSemColeta: 'Not collected yet', legDisputa: 'Disputed area (Natural Earth)',
      legOcupado: function (d) { return 'Military occupation (DeepStateMap, ' + d + ')'; }, legContestado: 'Contested zone', legClique: 'Click a hatched area for its news',
      areaGuerra: 'War zone', areaDisputa: 'Disputed area', areasDoPais: 'Wars and disputes', areasIrPara: 'Wars and disputes',
      paisesEnvolvidos: 'Countries involved', noticiasArea: 'News about the area', verArea: 'See the occupied area',
      semNoticiasArea: function (h) { return 'No stories about this area in the last ' + h + ' h from the countries collected so far.'; },
      ocupadoKm: function (km, pct) { return km + ' km² occupied (' + pct + ' of Ukraine)'; },
      contestadoKm: function (km) { return km + ' km² contested (grey zone)'; },
      variacao: function (v, d) { return (v > 0 ? '+' : v < 0 ? '−' : '±') + num(Math.abs(v)) + ' km² occupied since ' + d; },
      fonteGuerra: function (d) { return 'DeepStateMap, ' + d + '. Includes Crimea and the parts of Donetsk and Luhansk occupied since 2014.'; },
      dicaArea: 'click for news',
      ocupacaoUA: function (d) { return 'Part of the territory is under Russian military occupation, according to DeepStateMap (Ukrainian front-line mapping project) on ' + d + '.'; },
      creditoGuerra: 'Occupied areas: ',
      agora: 'just now', ha: function (n, u) { return n + ' ' + u + ' ago'; }, u: { m: 'min', h: 'h', d: 'd' },
      erro: 'Could not load the map data. Try reloading the page.', expandir: 'Expand panel', legenda: 'Legend', modoEscuro: 'Dark mode'
    },
    pt: {
      mapa: 'MAPA', titulo: 'O mundo pela imprensa local', irPara: 'Ir para', escolha: 'Ir para…',
      regioes: 'Regiões', paises: 'Países', mundo: 'Mundo', regiao: 'Região', pais: 'País',
      tema: 'Em foco', emFoco: 'EM FOCO', ultimas: 'O mais recente da imprensa local',
      noticias: function (n) { return n === 1 ? '1 notícia' : num(n) + ' notícias'; },
      dePaises: function (m) { return m === 1 ? 'de 1 país' : 'de ' + m + ' países'; },
      periodo: function (h) { return 'últimas ' + h + ' h'; },
      voltar: function (nome) { return '← ' + nome; },
      paisesDaRegiao: 'Países', regioesMaisAtivas: 'Regiões mais ativas', destaques: 'Notícias recentes',
      semNoticias: 'Nenhuma notícia da imprensa local neste período.',
      semColeta: 'Este país ainda não é coletado na fase de teste.',
      semFonte: 'O GDELT não tem código de fonte para este território.',
      ver: 'Território sem coleta própria. Veja ',
      abrir: 'Abrir matéria ↗', lerTraduzido: 'Ler traduzido', traduzir: 'Traduzir', estatal: 'Mídia estatal', exilio: 'Mídia no exílio', original: 'Original',
      atualizado: function (t) { return 'Atualizado em ' + t + ' (horário de Brasília).'; },
      aindaNao: 'A primeira coleta ainda não rodou.',
      teste: function (n) { return 'Fase de teste: ' + n + ' países coletados.'; },
      aviso: 'Coleta automática da imprensa local (GDELT), sem checagem item a item. Títulos com tradução automática.',
      avisoFontes: 'Só veículos conhecidos de cada país, de uma lista revisada. Coleta automática (GDELT), sem checagem item a item. Títulos com tradução automática.',
      fronteiras: 'Fronteiras: Natural Earth (situação de fato); áreas disputadas hachuradas.',
      creditos: 'Mapa: Raccoon Mundi, com dados do ',
      legTitulo: 'Notícias geopolíticas, últimas 24 h', menos: 'menos', mais: 'mais',
      legSem: 'Sem notícias', legSemColeta: 'Ainda sem coleta', legDisputa: 'Área disputada (Natural Earth)',
      legOcupado: function (d) { return 'Ocupação militar (DeepStateMap, ' + d + ')'; }, legContestado: 'Zona contestada', legClique: 'Clique numa área hachurada para ver as notícias',
      areaGuerra: 'Área em guerra', areaDisputa: 'Área disputada', areasDoPais: 'Guerras e disputas', areasIrPara: 'Guerras e disputas',
      paisesEnvolvidos: 'Países envolvidos', noticiasArea: 'Notícias sobre a área', verArea: 'Ver a área ocupada',
      semNoticiasArea: function (h) { return 'Nenhuma notícia sobre a área nas últimas ' + h + ' h, entre os países coletados até agora.'; },
      ocupadoKm: function (km, pct) { return km + ' km² ocupados (' + pct + ' da Ucrânia)'; },
      contestadoKm: function (km) { return km + ' km² em zona contestada'; },
      variacao: function (v, d) { return (v > 0 ? '+' : v < 0 ? '−' : '±') + num(Math.abs(v)) + ' km² ocupados desde ' + d; },
      fonteGuerra: function (d) { return 'DeepStateMap, ' + d + '. Inclui a Crimeia e as partes de Donetsk e Luhansk ocupadas desde 2014.'; },
      dicaArea: 'clique para ver as notícias',
      ocupacaoUA: function (d) { return 'Parte do território está sob ocupação militar russa, segundo o DeepStateMap (projeto ucraniano de mapeamento da linha de frente) em ' + d + '.'; },
      creditoGuerra: 'Áreas ocupadas: ',
      agora: 'agora', ha: function (n, u) { return 'há ' + n + ' ' + u; }, u: { m: 'min', h: 'h', d: 'd' },
      erro: 'Não foi possível carregar os dados do mapa. Tente recarregar a página.', expandir: 'Expandir painel', legenda: 'Legenda', modoEscuro: 'Modo escuro'
    }
  };
  var IDIOMAS_PT = {
    English: 'Inglês', Spanish: 'Espanhol', Portuguese: 'Português', French: 'Francês', German: 'Alemão',
    Russian: 'Russo', Ukrainian: 'Ucraniano', Chinese: 'Chinês', Arabic: 'Árabe', Persian: 'Persa',
    Hebrew: 'Hebraico', Turkish: 'Turco', Hindi: 'Hindi', Japanese: 'Japonês', Korean: 'Coreano',
    Italian: 'Italiano', Indonesian: 'Indonésio', Polish: 'Polonês', Dutch: 'Holandês', Urdu: 'Urdu',
    Bengali: 'Bengali', Vietnamese: 'Vietnamita', Thai: 'Tailandês', Greek: 'Grego', Romanian: 'Romeno',
    Hungarian: 'Húngaro', Czech: 'Tcheco', Swedish: 'Sueco', Hausa: 'Hauçá', Swahili: 'Suaíli'
  };

  /* Cores do mapa por tema. O significado não muda: mais notícias = laranja mais intenso, que no claro
     escurece e no escuro clareia (sempre contrastando mais com o fundo). */
  var PALETAS = {
    claro: {
      cores: ['#f6e3d6', '#eebfa2', '#e0916a', '#c9643a', '#a8400f'],
      zero: '#e9e3d7', semColeta: '#dcd7ce', semRegiao: '#e4dfd6', amostraBorda: '#d6cfc2',
      bordaRegiao: '#ffffff', bordaMacro: '#ffffff', bordaPais: '#7d776c',
      destaque: '#1f2a33', sombra: '#1f2a33', sombraOp: 0.45,
      disputa: '#2b3a44', disputaFundo: 'rgba(255,255,255,0.35)',
      guerra: '#8f1d0d', guerraFundo: 'rgba(143,29,13,0.16)', contestFundo: 'rgba(143,29,13,0.06)',
      legDisputa: 'repeating-linear-gradient(45deg,#efe9df 0 3px,#2b3a44 3px 4.5px);border:1px dashed #2b3a44',
      legOcupado: 'repeating-linear-gradient(-45deg,#f1d9d2 0 3px,#8f1d0d 3px 5px);border:1px solid #8f1d0d',
      legContestado: 'repeating-linear-gradient(-45deg,#f7ece8 0 2px,#c08070 2px 3px);border:1px dashed #8f1d0d'
    },
    escuro: {
      cores: ['#4b3126', '#713c23', '#9d4b23', '#cc602b', '#f3874e'],
      zero: '#2c333a', semColeta: '#20272e', semRegiao: '#262d34', amostraBorda: '#454f58',
      bordaRegiao: '#111820', bordaMacro: '#0d151b', bordaPais: '#5b656e',
      destaque: '#f3ede3', sombra: '#000000', sombraOp: 0.8,
      disputa: '#d3dbe0', disputaFundo: 'rgba(0,0,0,0.28)',
      guerra: '#ff7b5a', guerraFundo: 'rgba(255,123,90,0.18)', contestFundo: 'rgba(255,123,90,0.07)',
      legDisputa: 'repeating-linear-gradient(45deg,#2c333a 0 3px,#d3dbe0 3px 4.5px);border:1px dashed #d3dbe0',
      legOcupado: 'repeating-linear-gradient(-45deg,#3b2421 0 3px,#ff7b5a 3px 5px);border:1px solid #ff7b5a',
      legContestado: 'repeating-linear-gradient(-45deg,#2b2523 0 2px,#a8604f 2px 3px);border:1px dashed #ff7b5a'
    }
  };
  function temaAtual() { return document.documentElement.getAttribute('data-tema') === 'escuro' ? 'escuro' : 'claro'; }
  var P = PALETAS[temaAtual()];
  var LIMITES_PAIS = [1, 2, 3, 4], LIMITES_REGIAO = [1, 2, 3, 4]; // recalculados pelos dados (quintis)
  var VISTAS = { // regiões que cruzam a linha de data: enquadramento manual
    'russia': [[62, 95], 2.5], 'oceania': [[-22, 155], 3], 'america-do-norte': [[46, -100], 2.5]
  };
  var VISTAS_PAIS = { 'US': [[40, -98], 3], 'RU': [[62, 95], 2.5], 'NZ': [[-41, 173], 4.5], 'FJ': [[-17.8, 178], 6] };
  var LIMIAR_PAISES = 4;

  var estado = { l: 'en', h: 24, modo: 'regioes', sel: null };
  var D = { paises: {}, macros: [], macroPorId: {}, temas: [], temaPorId: {}, areas: [], areaPorId: {}, itens: [], porPais: {},
            volume: {}, coletados: null, gerado: null, teste: false };
  var camadaGuerra = null;
  var mapa, svg, camadaPaises, camadaMacros, camadaDisputa, camadaDestaque = null, macroLayer = {}, modoAuto = 'regioes';
  var G = {}; // contornos carregados (países e macrorregiões)
  var camadaRotulos = null;
  // posição dos nomes das macrorregiões [lat, lng], em ordem de prioridade quando não cabem todos
  var ROTULOS_REGIAO = {
    'russia': [62, 95], 'america-do-norte': [50, -102], 'america-do-sul': [-14, -60], 'africa-central-austral': [-14, 24],
    'oriente-medio': [28, 46], 'leste-asiatico': [36, 106], 'sul-da-asia': [21, 78], 'oceania': [-26, 134],
    'norte-da-africa': [26, 10], 'sahel-africa-ocidental': [14, -4], 'chifre-africa-oriental': [5, 39],
    'europa-ocidental': [49, -1], 'europa-oriental': [53, 31], 'europa-central-balcas': [45, 19],
    'caucaso-asia-central': [44, 63], 'sudeste-asiatico': [8, 110], 'america-central-caribe': [15, -80]
  };

  function t(k) { return T[estado.l][k]; }
  function num(n) { return Number(n).toLocaleString(estado.l === 'pt' ? 'pt-BR' : 'en-US'); }
  function el(tag, attrs, filhos) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'on') Object.keys(attrs.on).forEach(function (ev) { e.addEventListener(ev, attrs.on[ev]); });
      else e.setAttribute(k, attrs[k]);
    });
    (filhos || []).forEach(function (f) { if (f) e.appendChild(typeof f === 'string' ? document.createTextNode(f) : f); });
    return e;
  }
  function urlSegura(u) { return typeof u === 'string' && /^https?:\/\//i.test(u); }
  function nomePais(iso) { var p = D.paises[iso]; return p ? (estado.l === 'pt' ? p.nome_pt : p.nome_en) : iso; }
  function nomeRegiao(id) { var r = D.macroPorId[id]; return r ? (estado.l === 'pt' ? r.nome_pt : r.nome_en) : id; }
  function nomeArea(a) { return estado.l === 'pt' ? a.nome_pt : a.nome_en; }
  function itensDaArea(id) {
    return D.itens.filter(function (i) { return (i.areas || []).indexOf(id) >= 0 && noPeriodo(i); })
      .sort(function (a, b) { return b.visto_em < a.visto_em ? -1 : 1; });
  }
  function nomeTema(tm) { return estado.l === 'pt' ? (tm.nome_pt || tm.nome_en) : (tm.nome_en || tm.nome_pt); }

  /* ---------- dados ---------- */
  function referencia() { return D.gerado ? Date.parse(D.gerado) : Date.now(); }
  function noPeriodo(it) { return Date.parse(it.visto_em) >= referencia() - estado.h * 3600e3; }
  function itensDe(isos) {
    var out = [];
    isos.forEach(function (iso) { (D.porPais[iso] || []).forEach(function (it) { if (noPeriodo(it)) out.push(it); }); });
    return out.sort(function (a, b) { return b.visto_em < a.visto_em ? -1 : 1; });
  }
  function variar(itens, limite, maxPorPais) { // evita repetição e que um país domine a lista
    var cont = {}, vistos = {}, out = [];
    for (var i = 0; i < itens.length && out.length < limite; i++) {
      var k = (itens[i].titulo_original || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      if (vistos[k]) continue;
      var p = itens[i].pais; cont[p] = (cont[p] || 0) + 1;
      if (cont[p] <= maxPorPais) { out.push(itens[i]); vistos[k] = 1; }
    }
    return out;
  }
  function volPais(iso) { return D.volume[iso]; }
  function coletado(iso) { return D.coletados ? D.coletados.indexOf(iso) >= 0 : false; }
  function volRegiao(id) {
    var r = D.macroPorId[id], s = 0, algum = false;
    r.paises.forEach(function (iso) { if (coletado(iso)) { algum = true; s += volPais(iso) || 0; } });
    return algum ? s : null;
  }
  function cor(v, limites) {
    if (v === null || v === undefined) return P.semColeta;
    if (v === 0) return P.zero;
    for (var i = 0; i < limites.length; i++) if (v <= limites[i]) return P.cores[i];
    return P.cores[P.cores.length - 1];
  }
  function quintis(valores) { // cinco faixas com quantidades parecidas de países (ou regiões)
    var v = valores.filter(function (x) { return x > 0; }).sort(function (a, b) { return a - b; });
    if (!v.length) return [1, 2, 3, 4];
    return [0.2, 0.4, 0.6, 0.8].map(function (q) { return v[Math.floor(q * (v.length - 1))]; });
  }
  function calcularEscalas() {
    LIMITES_PAIS = quintis((D.coletados || []).map(function (iso) { return volPais(iso) || 0; }));
    LIMITES_REGIAO = quintis(D.macros.map(function (r) { return volRegiao(r.id) || 0; }));
  }

  /* ---------- tempo ---------- */
  var fmtData = { en: new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                  pt: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) };
  function dataCurta(d) { // '2026-11-24' -> 24/11/2026 (PT) ou 24 Nov 2026 (EN)
    if (!d || !/^\d{4}-\d{2}-\d{2}/.test(d)) return d || '';
    var dt = new Date(d.slice(0, 10) + 'T12:00:00Z');
    return dt.toLocaleDateString(estado.l === 'pt' ? 'pt-BR' : 'en-GB', { day: '2-digit', month: estado.l === 'pt' ? '2-digit' : 'short', year: 'numeric', timeZone: 'UTC' });
  }
  function relativo(iso) {
    var min = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (min < 2) return t('agora');
    if (min < 60) return t('ha')(min, t('u').m);
    var h = Math.round(min / 60);
    if (h < 48) return t('ha')(h, t('u').h);
    return t('ha')(Math.round(h / 24), t('u').d);
  }

  /* ---------- rota (#r= #p= #t= &l= &h=) ---------- */
  function lerRota() {
    var q = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (q.get('l') === 'pt' || q.get('l') === 'en') estado.l = q.get('l');
    if (['12', '24', '48'].indexOf(q.get('h')) >= 0) estado.h = +q.get('h');
    if (q.get('a') && D.areaPorId[q.get('a')]) estado.sel = { tipo: 'a', id: q.get('a') };
    else if (q.get('t') && D.temaPorId[q.get('t')]) estado.sel = { tipo: 't', id: q.get('t') };
    else if (q.get('p') && D.paises[q.get('p')]) estado.sel = { tipo: 'p', id: q.get('p') };
    else if (q.get('r') && D.macroPorId[q.get('r')]) estado.sel = { tipo: 'r', id: q.get('r') };
    else estado.sel = null;
    if (estado.sel && estado.sel.tipo !== 'r') estado.modo = 'paises';
  }
  function gravarRota() {
    var q = new URLSearchParams();
    if (estado.sel) q.set(estado.sel.tipo, estado.sel.id);
    if (estado.l !== 'en') q.set('l', estado.l);
    if (estado.h !== 24) q.set('h', String(estado.h));
    var h = q.toString();
    history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
  }

  /* ---------- mapa ---------- */
  function estiloPais(f) {
    var k = f.properties.k, r = f.properties.r, tema = estado.sel && estado.sel.tipo === 't' ? D.temaPorId[estado.sel.id] : null;
    if (!r) return { fillColor: P.semRegiao, fillOpacity: 1, color: P.bordaRegiao, weight: 0.4 };
    var fill = estado.modo === 'regioes' ? cor(volRegiao(r), LIMITES_REGIAO) : cor(coletado(k) ? (volPais(k) || 0) : null, LIMITES_PAIS);
    var s = estado.modo === 'regioes'
      ? { fillColor: fill, fillOpacity: 1, color: P.bordaRegiao, weight: 0.4, opacity: 0.9, lineJoin: 'round' }
      : { fillColor: fill, fillOpacity: 1, color: P.bordaPais, weight: 0.8, opacity: 0.85, lineJoin: 'round' };
    if (tema && (tema.paises || []).indexOf(k) < 0) s.fillOpacity = 0.35;
    return s;
  }
  function estiloMacro() {
    return { fill: false, color: P.bordaMacro, weight: estado.modo === 'regioes' ? 1.6 : 1 };
  }
  function estiloDisputa() {
    return { fillColor: 'url(#hachura)', fillOpacity: 1, color: P.disputa, weight: 1.1, opacity: 0.85, dashArray: '4 3' };
  }
  function estiloGuerra(f) {
    return f.properties.tipo === 'ocupado'
      ? { fillColor: 'url(#hachura-guerra)', fillOpacity: 1, color: P.guerra, weight: 1.4, opacity: 0.95 }
      : { fillColor: 'url(#hachura-contestada)', fillOpacity: 1, color: P.guerra, weight: 0.8, opacity: 0.7, dashArray: '2 3' };
  }
  function restyle() {
    camadaPaises.setStyle(estiloPais);
    camadaMacros.setStyle(estiloMacro);
    atualizarDestaque();
    atualizarRotulos();
  }
  /* Destaque da seleção: a área "sai" do mapa. Três camadas: sombra desfocada um pouco abaixo,
     preenchimento erguido com a cor atual e contorno escuro. Sem retângulo de foco. */
  function atualizarDestaque() {
    if (camadaDestaque) { mapa.removeLayer(camadaDestaque); camadaDestaque = null; }
    var s = estado.sel; if (!s) return;
    var contorno, preench;
    if (s.tipo === 'r') {
      contorno = G.macros.features.filter(function (f) { return f.properties.r === s.id; });
      preench = G.paises.features.filter(function (f) { return f.properties.r === s.id; });
    } else if (s.tipo === 'a') {
      preench = contorno = featuresDaArea(s.id);
    } else {
      var alvo = s.tipo === 'p' ? [s.id] : ((D.temaPorId[s.id] || {}).paises || []);
      preench = contorno = G.paises.features.filter(function (f) { return alvo.indexOf(f.properties.k) >= 0; });
    }
    if (!contorno.length) return;
    var fc = function (fs) { return { type: 'FeatureCollection', features: fs }; };
    var sombra = L.geoJSON(fc(contorno), { renderer: svg, smoothFactor: 0.4, interactive: false,
      style: { stroke: false, fillColor: P.sombra, fillOpacity: P.sombraOp } });
    var cima = L.geoJSON(fc(preench), { renderer: svg, smoothFactor: 0.4, interactive: false,
      style: function (f) {
        if (s.tipo === 'a') { var h = f.properties.tipo ? estiloGuerra(f) : estiloDisputa(); return { fillColor: h.fillColor, fillOpacity: 1, color: h.color, opacity: 1, weight: h.weight, dashArray: null }; }
        var e = estiloPais(f); return { fillColor: e.fillColor, fillOpacity: 1, color: e.color, opacity: e.opacity, weight: e.weight };
      } });
    var borda = L.geoJSON(fc(contorno), { renderer: svg, smoothFactor: 0.4, interactive: false,
      style: { fill: false, color: P.destaque, weight: 2, lineJoin: 'round' } });
    camadaDestaque = L.layerGroup([sombra, cima, borda]).addTo(mapa);
    sombra.eachLayer(function (l) { l._path.setAttribute('filter', 'url(#sombra)'); l._path.setAttribute('transform', 'translate(0 6)'); });
    cima.eachLayer(function (l) { l._path.setAttribute('transform', 'translate(0 -2)'); });
    borda.eachLayer(function (l) { l._path.setAttribute('transform', 'translate(0 -2)'); });
    if (camadaDisputa) camadaDisputa.bringToFront();
    if (camadaGuerra) camadaGuerra.bringToFront();
    if (s.tipo === 'a') { sombra.bringToFront(); cima.bringToFront(); borda.bringToFront(); } // a área selecionada fica por cima das outras hachuras
  }
  function featuresDaArea(id) {
    var fs = (G.disputa ? G.disputa.features : []).filter(function (f) { return f.properties.a === id; });
    if (G.guerra) fs = fs.concat(G.guerra.features.filter(function (f) { return f.properties.a === id; }));
    return fs;
  }
  /* Áreas hachuradas clicáveis: abrem o painel da área com contexto, dados e notícias. */
  function ligarArea(f, layer) {
    var a = D.areaPorId[f.properties.a]; if (!a) return;
    layer.on('mouseover', function () {
      layer.bindTooltip(nomeArea(a) + ' · ' + t('dicaArea'), { sticky: true, className: 'rotulo-mapa', direction: 'top', offset: [0, -8] }).openTooltip();
      layer.setStyle({ weight: 2.4, opacity: 1 });
    });
    layer.on('mouseout', function () { layer.unbindTooltip(); layer.setStyle(f.properties.tipo ? estiloGuerra(f) : estiloDisputa()); });
    layer.on('click', function (e) {
      L.DomEvent.stopPropagation(e); layer.unbindTooltip();
      selecionar({ tipo: 'a', id: a.id }, mapa.getZoom() < 4);
    });
  }
  function rotuloHover(f) {
    var k = f.properties.k, r = f.properties.r;
    if (!r) return null;
    if (estado.modo === 'regioes') {
      var vr = volRegiao(r);
      return nomeRegiao(r) + (vr === null ? '' : ' · ' + t('noticias')(vr));
    }
    var vp = coletado(k) ? (volPais(k) || 0) : null;
    return nomePais(k) + (vp === null ? '' : ' · ' + t('noticias')(vp));
  }
  function margemGaveta() { // altura da gaveta do painel no celular (cobre a parte de baixo do mapa)
    if (window.innerWidth >= 820) return 0;
    var p = document.getElementById('painel');
    return p.classList.contains('aberto') ? 0 : p.offsetHeight;
  }
  function voarPara(centro, zoom) {
    var m = margemGaveta();
    if (m) { var pt = mapa.project(centro, zoom).add([0, m / 2]); centro = mapa.unproject(pt, zoom); }
    mapa.flyTo(centro, zoom, { duration: 0.6 });
  }
  function voarParaArea(b, zmax) {
    mapa.flyToBounds(b, { paddingTopLeft: [24, 24], paddingBottomRight: [24, 24 + margemGaveta()], maxZoom: zmax, duration: 0.6 });
  }
  function enquadrar(tipo, id) {
    if (tipo === 'r') {
      if (VISTAS[id]) voarPara(VISTAS[id][0], VISTAS[id][1] - (window.innerWidth < 820 ? 0.5 : 0));
      else if (macroLayer[id]) voarParaArea(macroLayer[id].getBounds(), 5);
    } else if (tipo === 't') { // tema: enquadra os países envolvidos pelos pontos dos nomes
      var pts = ((D.temaPorId[id] || {}).paises || []).map(function (k) { var p = D.paises[k]; return p && p.lx !== undefined ? [p.ly, p.lx] : null; })
        .filter(Boolean);
      if (pts.length) voarParaArea(L.latLngBounds(pts).pad(0.35), 4);
    } else if (tipo === 'a') {
      var ba = null;
      featuresDaArea(id).forEach(function (f) {
        if (f.properties.copia !== 0) return;
        var bb = L.geoJSON(f).getBounds(); ba = ba ? ba.extend(bb) : bb;
      });
      if (ba) voarParaArea(ba.pad(0.15), 6);
    } else if (tipo === 'p') {
      if (VISTAS_PAIS[id]) { voarPara(VISTAS_PAIS[id][0], VISTAS_PAIS[id][1]); return; }
      var b = null;
      camadaPaises.eachLayer(function (l) {
        if (l.feature.properties.k === id && l.feature.properties.copia === 0) b = b ? b.extend(l.getBounds()) : L.latLngBounds(l.getBounds().getSouthWest(), l.getBounds().getNorthEast());
      });
      if (b && b.getEast() - b.getWest() < 180) voarParaArea(b, 6);
    }
  }
  /* Mapa contínuo: cada camada é desenhada três vezes (mundo à esquerda, central e à direita).
     Com worldCopyJump, ao cruzar a linha de data o mapa volta para o mundo central sem o usuário perceber. */
  function desloca(coords, dx) {
    return typeof coords[0] === 'number' ? [coords[0] + dx, coords[1]] : coords.map(function (c) { return desloca(c, dx); });
  }
  function tresMundos(fc) {
    var out = [];
    [-360, 0, 360].forEach(function (dx) {
      fc.features.forEach(function (f) {
        out.push({ type: 'Feature', properties: Object.assign({ copia: dx }, f.properties),
          geometry: { type: f.geometry.type, coordinates: desloca(f.geometry.coordinates, dx) } });
      });
    });
    return { type: 'FeatureCollection', features: out };
  }
  /* Nomes no mapa: regiões no zoom de longe, países no zoom de perto (a partir do MIN_LABEL do Natural Earth).
     Recalculados a cada movimento: só entram os visíveis e os que não encostam num nome já colocado. */
  function quebrar(txt, max) {
    if (txt.length <= max) return [txt];
    var p = txt.split(' '), l1 = '', l2 = '';
    p.forEach(function (w) { if ((l1 + ' ' + w).trim().length <= Math.ceil(txt.length / 2) + 2 && !l2) l1 = (l1 + ' ' + w).trim(); else l2 = (l2 + ' ' + w).trim(); });
    return l2 ? [l1, l2] : [l1];
  }
  function atualizarRotulos() {
    if (!camadaRotulos) return;
    camadaRotulos.clearLayers();
    var z = mapa.getZoom(), pequeno = window.innerWidth < 820, area = mapa.getBounds();
    var cand = [];
    if (estado.modo === 'regioes') {
      Object.keys(ROTULOS_REGIAO).forEach(function (id, i) {
        if (!D.macroPorId[id]) return;
        cand.push({ ll: ROTULOS_REGIAO[id], linhas: quebrar(nomeRegiao(id).toUpperCase(), pequeno ? 12 : 16), cls: 'rotulo rotulo-regiao', fs: pequeno ? 10.5 : 12, prio: i });
      });
    } else {
      Object.keys(D.paises).forEach(function (k) {
        var p = D.paises[k];
        if (!p.r || p.lx === undefined || z < p.mz + (pequeno ? 1 : 0.3)) return;
        cand.push({ ll: [p.ly, p.lx], linhas: quebrar(nomePais(k).toUpperCase(), 14), cls: 'rotulo rotulo-pais', fs: pequeno ? 9.5 : 10.5,
          prio: 100 + p.rank * 10 + p.mz });
      });
    }
    cand.sort(function (a, b) { return a.prio - b.prio; });
    var postos = [];
    cand.forEach(function (c) {
      var larg = Math.max.apply(null, c.linhas.map(function (l) { return l.length; })) * c.fs * 0.74 + 6;
      var alt = c.linhas.length * c.fs * 1.2 + 4;
      [-360, 0, 360].forEach(function (dx) {
        var ll = L.latLng(c.ll[0], c.ll[1] + dx);
        if (!area.contains(ll)) return;
        var pt = mapa.latLngToContainerPoint(ll);
        var cx = { x1: pt.x - larg / 2, x2: pt.x + larg / 2, y1: pt.y - alt / 2, y2: pt.y + alt / 2 };
        var tam = mapa.getSize();
        if (cx.x1 < 2 || cx.y1 < 2 || cx.x2 > tam.x - 2 || cx.y2 > tam.y - 2) return; // nome cortado na borda: não mostra
        if (postos.some(function (o) { return cx.x1 < o.x2 + 4 && cx.x2 > o.x1 - 4 && cx.y1 < o.y2 + 2 && cx.y2 > o.y1 - 2; })) return;
        postos.push(cx);
        var div = el('div', { class: c.cls, style: 'font-size:' + c.fs + 'px' });
        c.linhas.forEach(function (l, i) { if (i) div.appendChild(document.createElement('br')); div.appendChild(document.createTextNode(l)); });
        camadaRotulos.addLayer(L.marker(ll, { pane: 'rotulos', interactive: false, keyboard: false,
          icon: L.divIcon({ className: 'rotulo-ancora', html: div, iconSize: [larg, alt], iconAnchor: [larg / 2, alt / 2] }) }));
      });
    });
  }
  /* Hachuras e sombra em <defs> do SVG do mapa. Criadas uma vez; ao trocar o tema só as cores mudam. */
  function criarHachura() {
    var c = svg._container; if (!c) return;
    var ns = 'http://www.w3.org/2000/svg', defs = c.querySelector('defs');
    if (!defs) { defs = document.createElementNS(ns, 'defs'); c.insertBefore(defs, c.firstChild); }
    var padrao = function (id, tam, ang, fundo, traco, larg, opac) {
      var p = defs.querySelector('#' + id), r, ln;
      if (!p) {
        p = document.createElementNS(ns, 'pattern');
        p.setAttribute('id', id); p.setAttribute('patternUnits', 'userSpaceOnUse'); p.setAttribute('width', tam); p.setAttribute('height', tam);
        p.setAttribute('patternTransform', 'rotate(' + ang + ')');
        r = document.createElementNS(ns, 'rect'); r.setAttribute('width', tam); r.setAttribute('height', tam);
        ln = document.createElementNS(ns, 'line'); ln.setAttribute('x1', '0'); ln.setAttribute('y1', '0'); ln.setAttribute('x2', '0'); ln.setAttribute('y2', tam);
        ln.setAttribute('stroke-width', larg); ln.setAttribute('stroke-opacity', opac);
        p.appendChild(r); p.appendChild(ln); defs.appendChild(p);
      }
      p.querySelector('rect').setAttribute('fill', fundo);
      p.querySelector('line').setAttribute('stroke', traco);
    };
    padrao('hachura', '7', 45, P.disputaFundo, P.disputa, '1.8', '0.75');                // área disputada
    padrao('hachura-guerra', '8', -45, P.guerraFundo, P.guerra, '2.6', '0.85');          // ocupação militar
    padrao('hachura-contestada', '5', -45, P.contestFundo, P.guerra, '1', '0.5');        // zona contestada
    if (!defs.querySelector('#sombra')) {
      var fl = document.createElementNS(ns, 'filter'); fl.setAttribute('id', 'sombra');
      fl.setAttribute('x', '-30%'); fl.setAttribute('y', '-30%'); fl.setAttribute('width', '160%'); fl.setAttribute('height', '160%');
      var bl = document.createElementNS(ns, 'feGaussianBlur'); bl.setAttribute('stdDeviation', '5');
      fl.appendChild(bl); defs.appendChild(fl);
    }
  }
  function montarMapa(geoPaises, geoMacros, geoDisputa) {
    var pequeno = window.innerWidth < 820;
    mapa = L.map('mapa', { zoomSnap: 0.5, minZoom: pequeno ? 1 : 1.5, maxZoom: 7, worldCopyJump: true,
      maxBounds: [[-75, -1e5], [88, 1e5]], maxBoundsViscosity: 1, attributionControl: false });
    svg = L.svg({ padding: 0.5 });
    mapa.setView([28, 15], pequeno ? 1 : 2);
    camadaPaises = L.geoJSON(geoPaises, { renderer: svg, smoothFactor: 0.4, style: estiloPais, onEachFeature: function (f, layer) {
      if (!f.properties.r) return;
      layer.on('mouseover', function () {
        var txt = rotuloHover(f); if (!txt) return;
        layer.bindTooltip(txt, { sticky: true, className: 'rotulo-mapa', direction: 'top', offset: [0, -8] }).openTooltip();
        if (estado.modo === 'paises') layer.setStyle({ weight: 2, color: P.destaque });
      });
      layer.on('mouseout', function () { layer.unbindTooltip(); camadaPaises.resetStyle(layer); });
      layer.on('click', function () {
        layer.unbindTooltip();
        if (estado.modo === 'regioes') selecionar({ tipo: 'r', id: f.properties.r }, true);
        else selecionar({ tipo: 'p', id: f.properties.k }, false);
      });
    } }).addTo(mapa);
    camadaMacros = L.geoJSON(geoMacros, { renderer: svg, smoothFactor: 0.4, interactive: false, style: estiloMacro,
      onEachFeature: function (f, layer) { if (f.properties.copia === 0) macroLayer[f.properties.r] = layer; } }).addTo(mapa);
    camadaDisputa = L.geoJSON(geoDisputa, { renderer: svg, smoothFactor: 0.4, style: estiloDisputa, onEachFeature: ligarArea }).addTo(mapa);
    if (G.guerra) camadaGuerra = L.geoJSON(G.guerra, { renderer: svg, smoothFactor: 0.4, style: estiloGuerra, onEachFeature: ligarArea }).addTo(mapa);
    criarHachura();
    mapa.createPane('rotulos').style.zIndex = 450;
    camadaRotulos = L.layerGroup().addTo(mapa);
    mapa.on('moveend', atualizarRotulos);
    mapa.on('movestart zoomstart', function () {
      [camadaPaises, camadaDisputa, camadaGuerra].forEach(function (c) { if (c) c.eachLayer(function (l) { l.unbindTooltip(); }); });
    });
    mapa.on('zoomend', function () {
      var m = mapa.getZoom() >= LIMIAR_PAISES ? 'paises' : 'regioes';
      if (m !== modoAuto) { modoAuto = m; if (estado.modo !== m) { estado.modo = m; atualizarModo(); restyle(); } }
    });
  }

  /* ---------- painel ---------- */
  var ICONE_TRADUZIR = 'M5 4h7M8.5 4v1.5c0 2.6-1.6 4.9-4 6M6 7.5c.9 1.7 2.4 3 4.2 3.7M11 20l4-9 4 9M12.3 17h5.4';
  function iconeTraduzir() {
    var ns = 'http://www.w3.org/2000/svg', sv = document.createElementNS(ns, 'svg'), pa = document.createElementNS(ns, 'path');
    sv.setAttribute('viewBox', '0 0 24 24'); sv.setAttribute('width', '14'); sv.setAttribute('height', '14'); sv.setAttribute('aria-hidden', 'true');
    pa.setAttribute('d', ICONE_TRADUZIR); pa.setAttribute('fill', 'none'); pa.setAttribute('stroke', 'currentColor');
    pa.setAttribute('stroke-width', '1.8'); pa.setAttribute('stroke-linecap', 'round'); pa.setAttribute('stroke-linejoin', 'round');
    sv.appendChild(pa); return sv;
  }
  /* Cartão de notícia: o título é o único link para a matéria; numa linha só, veículo · idioma · hora,
     selos e o atalho de tradução da página. */
  function cartao(it) {
    var exib = estado.l === 'pt' ? (it.titulo_pt || it.titulo_en || it.titulo_original) : (it.titulo_en || it.titulo_original);
    var link = urlSegura(it.url) ? it.url : null;
    var titulo = el('h3', { class: 'titulo' }, [link ? el('a', { href: link, target: '_blank', rel: 'noopener', text: exib }) : exib]);
    var filhos = [titulo];
    if (exib !== it.titulo_original) filhos.push(el('p', { class: 'original', lang: it.lc || '', text: it.titulo_original }));
    var idioma = estado.l === 'pt' ? (IDIOMAS_PT[it.idioma] || it.idioma) : it.idioma;
    var meta = el('div', { class: 'meta' }, [
      el('span', { class: 'veiculo', text: it.veiculo_nome || it.veiculo, title: it.veiculo }),
      idioma ? el('span', { class: 'ponto', text: idioma }) : null,
      el('time', { class: 'ponto', datetime: it.visto_em, title: fmtData[estado.l].format(new Date(it.visto_em)), text: relativo(it.visto_em) }),
      it.midia_estatal ? el('span', { class: 'selo', text: t('estatal') }) : null,
      it.midia_exilio ? el('span', { class: 'selo exilio', text: t('exilio') }) : null
    ]);
    if (link) {
      var tr = el('a', { class: 'traduzir', href: 'https://translate.google.com/translate?sl=auto&tl=' + estado.l + '&u=' + encodeURIComponent(link),
        target: '_blank', rel: 'noopener', title: t('lerTraduzido'), 'aria-label': t('lerTraduzido') + ': ' + exib });
      tr.appendChild(iconeTraduzir()); tr.appendChild(document.createTextNode(t('traduzir')));
      meta.appendChild(tr);
    }
    filhos.push(meta);
    return el('article', { class: 'item' }, filhos);
  }
  function lista(itens) {
    if (!itens.length) return [el('p', { class: 'vazio', text: t('semNoticias') })];
    return itens.map(cartao);
  }
  function resumo(itens) {
    var ps = {}; itens.forEach(function (i) { ps[i.pais] = 1; });
    return t('noticias')(itens.length) + ' ' + t('dePaises')(Object.keys(ps).length) + ' · ' + t('periodo')(estado.h);
  }
  function botaoPais(iso) {
    var n = itensDe([iso]).length, col = coletado(iso);
    return el('button', { type: 'button', class: col && n ? '' : 'sem', on: { click: function () { selecionar({ tipo: 'p', id: iso }, true); } } },
      [nomePais(iso), col ? el('span', { class: 'n', text: num(n) }) : null]);
  }
  function renderPainel() {
    var c = document.getElementById('painel-conteudo'); c.textContent = '';
    var s = estado.sel, add = function (n) { if (n) c.appendChild(n); };
    if (!D.gerado) add(el('p', { class: 'aviso', text: t('aindaNao') }));
    if (!s) {
      var todos = itensDe(Object.keys(D.porPais));
      add(el('div', { class: 'tipo', text: t('mundo') }));
      add(el('h2', { text: t('ultimas') }));
      add(el('p', { class: 'resumo', text: resumo(todos) }));
      var regs = D.macros.map(function (r) { return { r: r, v: volRegiao(r.id) }; }).filter(function (x) { return x.v; })
        .sort(function (a, b) { return b.v - a.v; });
      if (regs.length) {
        add(el('div', { class: 'secao', text: t('regioesMaisAtivas') }));
        add(el('div', { class: 'lista-paises' }, regs.map(function (x) {
          return el('button', { type: 'button', on: { click: function () { selecionar({ tipo: 'r', id: x.r.id }, true); } } },
            [nomeRegiao(x.r.id), el('span', { class: 'n', text: num(x.v) })]);
        })));
      }
      add(el('div', { class: 'secao', text: t('destaques') }));
      var fortes = todos.filter(function (i) { return (i.pontos || 0) >= 3; }); // no "Mundo", primeiro as mais geopolíticas
      lista(variar(fortes.length >= 12 ? fortes : todos, 12, 2)).forEach(add);
    } else if (s.tipo === 'r') {
      var r = D.macroPorId[s.id], it = itensDe(r.paises);
      add(el('button', { type: 'button', class: 'voltar', text: t('voltar')(t('mundo')), on: { click: function () { selecionar(null, false); mapa.flyTo([28, 15], 2, { duration: 0.6 }); } } }));
      add(el('div', { class: 'tipo', text: t('regiao') }));
      add(el('h2', { text: nomeRegiao(s.id) }));
      add(el('p', { class: 'resumo', text: resumo(it) }));
      add(el('div', { class: 'secao', text: t('paisesDaRegiao') }));
      var membros = r.paises.slice().sort(function (a, b) { return (itensDe([b]).length - itensDe([a]).length) || nomePais(a).localeCompare(nomePais(b)); });
      add(el('div', { class: 'lista-paises' }, membros.map(botaoPais)));
      add(el('div', { class: 'secao', text: t('destaques') }));
      lista(variar(it, 10, 3)).forEach(add);
    } else if (s.tipo === 'p') {
      var p = D.paises[s.id], itp = itensDe([s.id]);
      add(el('button', { type: 'button', class: 'voltar', text: t('voltar')(nomeRegiao(p.r)), on: { click: function () { selecionar({ tipo: 'r', id: p.r }, true); } } }));
      add(el('div', { class: 'tipo', text: t('pais') + ' · ' + nomeRegiao(p.r) }));
      add(el('h2', { text: nomePais(s.id) }));
      if (G.guerraMeta && s.id === 'UA') add(el('p', { class: 'aviso guerra' }, [t('ocupacaoUA')(dataCurta(G.guerraMeta.data)) + ' ',
        el('a', { href: '#a=ucrania', text: t('verArea') + ' →', on: { click: function (e) { e.preventDefault(); selecionar({ tipo: 'a', id: 'ucrania' }, true); } } })]));
      var dele = D.areas.filter(function (a) { return (a.paises || []).indexOf(s.id) >= 0 && (a.id !== 'ucrania' || s.id !== 'UA'); });
      if (dele.length) {
        add(el('div', { class: 'secao', text: t('areasDoPais') }));
        add(el('div', { class: 'lista-paises areas' }, dele.map(function (a) {
          return el('button', { type: 'button', class: 'area-' + a.tipo, on: { click: function () { selecionar({ tipo: 'a', id: a.id }, true); } } }, [nomeArea(a)]);
        })));
      }
      if (p.ver !== undefined) {
        add(el('p', { class: 'aviso' }, p.ver ? [t('ver'), el('a', { href: '#p=' + p.ver, text: nomePais(p.ver), on: { click: function (e) { e.preventDefault(); selecionar({ tipo: 'p', id: p.ver }, true); } } }), '.'] : [t('semFonte')]));
      } else if (!coletado(s.id)) {
        add(el('p', { class: 'aviso', text: t('semColeta') }));
      } else {
        add(el('p', { class: 'resumo', text: resumo(itp) }));
        lista(variar(itp, 10, 10)).forEach(add);
      }
    } else if (s.tipo === 'a') {
      var ar = D.areaPorId[s.id], ita = itensDaArea(s.id);
      add(el('button', { type: 'button', class: 'voltar', text: t('voltar')(t('mundo')), on: { click: function () { selecionar(null, false); } } }));
      add(el('div', { class: 'tipo', text: ar.tipo === 'guerra' ? t('areaGuerra') : t('areaDisputa') }));
      add(el('h2', { text: nomeArea(ar) }));
      add(el('p', { class: 'contexto', text: estado.l === 'pt' ? ar.contexto_pt : ar.contexto_en }));
      if (ar.deepstate && G.guerraMeta && G.guerraMeta.ocupado_km2) add(dadosGuerra(G.guerraMeta));
      add(el('div', { class: 'secao', text: t('paisesEnvolvidos') }));
      add(el('div', { class: 'lista-paises' }, (ar.paises || []).filter(function (i) { return D.paises[i]; }).map(botaoPais)));
      add(el('div', { class: 'secao', text: t('noticiasArea') }));
      if (ita.length) { add(el('p', { class: 'resumo', text: resumo(ita) })); lista(variar(ita, 15, 5)).forEach(add); }
      else add(el('p', { class: 'vazio', text: t('semNoticiasArea')(estado.h) }));
    } else if (s.tipo === 't') {
      var tm = D.temaPorId[s.id];
      var itt = D.itens.filter(function (i) { return (i.temas || []).indexOf(s.id) >= 0 && noPeriodo(i); })
        .sort(function (a, b) { return b.visto_em < a.visto_em ? -1 : 1; });
      add(el('button', { type: 'button', class: 'voltar', text: t('voltar')(t('mundo')), on: { click: function () { selecionar(null, false); } } }));
      add(el('div', { class: 'tipo', text: t('tema') }));
      add(el('h2', { text: nomeTema(tm) }));
      var ctx = estado.l === 'pt' ? tm.contexto_pt : (tm.contexto_en || tm.contexto_pt);
      if (ctx) add(el('p', { class: 'contexto', text: ctx }));
      add(el('div', { class: 'lista-paises' }, (tm.paises || []).filter(function (i) { return D.paises[i]; }).map(botaoPais)));
      add(el('p', { class: 'resumo', text: resumo(itt) }));
      lista(variar(itt, 15, 4)).forEach(add);
    }
    c.scrollTop = 0;
    var h2 = c.querySelector('h2'), viva = document.getElementById('anuncio');
    if (viva && h2) viva.textContent = h2.textContent;
  }
  function dadosGuerra(m) { // área ocupada, zona contestada e variação na última semana
    var linhas = [el('p', { class: 'grande', text: t('ocupadoKm')(num(m.ocupado_km2), num(m.ocupado_pct) + '%') })];
    if (m.contestado_km2) linhas.push(el('p', { text: t('contestadoKm')(num(m.contestado_km2)) }));
    var h = (m.historico || []).slice().sort(function (a, b) { return a.data < b.data ? -1 : 1; }), ult = h[h.length - 1];
    if (ult) {
      var limite = new Date(Date.parse(ult.data) - 6 * 864e5).toISOString().slice(0, 10);
      var base = h.filter(function (x) { return x.data <= limite; }).pop();
      if (base) linhas.push(el('p', { text: t('variacao')(ult.ocupado_km2 - base.ocupado_km2, dataCurta(base.data)) }));
    }
    linhas.push(el('p', { class: 'fonte', text: t('fonteGuerra')(dataCurta(m.data)) }));
    return el('div', { class: 'dados-guerra' }, linhas);
  }
  function renderRodape() {
    var r = document.getElementById('rodape'); r.textContent = '';
    if (D.gerado) r.appendChild(el('p', { text: t('atualizado')(fmtData[estado.l].format(new Date(D.gerado))) }));
    if (D.teste && D.coletados) r.appendChild(el('p', { text: t('teste')(D.coletados.length) }));
    r.appendChild(el('p', { text: t(D.fontesConhecidas ? 'avisoFontes' : 'aviso') }));
    r.appendChild(el('p', { text: t('fronteiras') }));
    if (G.guerraMeta) r.appendChild(el('p', {}, [t('creditoGuerra'), el('a', { href: 'https://deepstatemap.live', target: '_blank', rel: 'noopener', text: 'DeepStateMap' }), ', ' + dataCurta(G.guerraMeta.data) + '.']));
    r.appendChild(el('p', {}, [t('creditos'), el('a', { href: 'https://www.naturalearthdata.com', target: '_blank', rel: 'noopener', text: 'Natural Earth' }),
      estado.l === 'pt' ? ' e do ' : ' and ', el('a', { href: 'https://www.gdeltproject.org', target: '_blank', rel: 'noopener', text: 'GDELT' }), '.']));
  }
  function renderLegenda() {
    var g = document.getElementById('legenda'); g.textContent = '';
    g.appendChild(el('div', { text: t('legTitulo') }));
    g.appendChild(el('div', { class: 'escala' }, P.cores.map(function (c) { return el('span', { style: 'background:' + c }); })));
    g.appendChild(el('div', { style: 'display:flex;justify-content:space-between' }, [el('span', { text: t('menos') }), el('span', { text: t('mais') })]));
    g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + P.zero + ';border:1px solid ' + P.amostraBorda }), t('legSem')]));
    if (D.teste || !D.gerado) g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + P.semColeta }), t('legSemColeta')]));
    g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + P.legDisputa }), t('legDisputa')]));
    if (G.guerraMeta) {
      g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + P.legOcupado }), t('legOcupado')(dataCurta(G.guerraMeta.data))]));
      g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + P.legContestado }), t('legContestado')]));
    }
    if (D.areas.length) g.appendChild(el('div', { class: 'dica', text: t('legClique') }));
  }
  function renderTemas() {
    var n = document.getElementById('temas'); n.textContent = '';
    var ativos = D.temas.filter(function (x) { return x.ativo !== false; });
    n.hidden = !ativos.length;
    n.appendChild(el('span', { class: 'rotulo', text: t('emFoco') }));
    ativos.forEach(function (tm) {
      var on = estado.sel && estado.sel.tipo === 't' && estado.sel.id === tm.id;
      n.appendChild(el('button', { type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false', text: nomeTema(tm),
        on: { click: function () { selecionar(on ? null : { tipo: 't', id: tm.id }, false); } } }));
    });
  }
  function renderIrPara() {
    var s = document.getElementById('ir-para'); s.textContent = '';
    s.setAttribute('aria-label', t('irPara'));
    s.appendChild(el('option', { value: '', text: t('escolha') }));
    var g1 = el('optgroup', { label: t('regioes') });
    D.macros.slice().sort(function (a, b) { return nomeRegiao(a.id).localeCompare(nomeRegiao(b.id)); })
      .forEach(function (r) { g1.appendChild(el('option', { value: 'r:' + r.id, text: nomeRegiao(r.id) })); });
    var g2 = el('optgroup', { label: t('paises') });
    Object.keys(D.paises).filter(function (k) { return D.paises[k].r; })
      .sort(function (a, b) { return nomePais(a).localeCompare(nomePais(b), estado.l); })
      .forEach(function (k) { g2.appendChild(el('option', { value: 'p:' + k, text: nomePais(k) })); });
    var g3 = el('optgroup', { label: t('areasIrPara') });
    D.areas.slice().sort(function (a, b) { return nomeArea(a).localeCompare(nomeArea(b), estado.l); })
      .forEach(function (a) { g3.appendChild(el('option', { value: 'a:' + a.id, text: nomeArea(a) })); });
    s.appendChild(g1); s.appendChild(g2); if (D.areas.length) s.appendChild(g3);
  }
  function atualizarBotoes() {
    document.querySelectorAll('#idioma button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.l === estado.l ? 'true' : 'false'); });
    document.querySelectorAll('#periodo button').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.h === estado.h ? 'true' : 'false'); });
    atualizarModo();
  }
  function atualizarModo() {
    document.querySelectorAll('#modo button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.m === estado.modo ? 'true' : 'false'); });
  }
  function traduzirInterface() {
    document.documentElement.lang = estado.l === 'pt' ? 'pt-BR' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.dataset.i18n); });
    document.getElementById('alca').setAttribute('aria-label', t('expandir'));
    atualizarBotaoTema();
  }
  /* Modo claro/escuro: segue o sistema até a pessoa escolher; a escolha fica guardada neste navegador. */
  function atualizarBotaoTema() {
    var b = document.getElementById('tema'); if (!b) return;
    b.setAttribute('aria-pressed', temaAtual() === 'escuro' ? 'true' : 'false');
    b.setAttribute('aria-label', t('modoEscuro')); b.title = t('modoEscuro');
  }
  function aplicarTema(tm, gravar) {
    document.documentElement.setAttribute('data-tema', tm);
    P = PALETAS[tm];
    if (gravar) { try { localStorage.setItem('mapa-tema', tm); } catch (e) { /* sem armazenamento: vale só nesta visita */ } }
    atualizarBotaoTema();
    if (!mapa) return;
    criarHachura();
    camadaDisputa.setStyle(estiloDisputa);
    if (camadaGuerra) camadaGuerra.setStyle(estiloGuerra);
    renderLegenda(); restyle();
  }
  function renderTudo() {
    traduzirInterface(); atualizarBotoes(); renderTemas(); renderIrPara(); renderLegenda(); renderPainel(); renderRodape(); restyle();
  }

  function selecionar(sel, mover) {
    estado.sel = sel;
    gravarRota();
    if (sel && sel.tipo !== 'r' && estado.modo !== 'paises') { estado.modo = 'paises'; atualizarModo(); }
    renderTemas(); renderPainel(); restyle();
    if (sel && mover) enquadrar(sel.tipo, sel.id);
    if (sel) document.getElementById('painel').classList.add('aberto');
  }

  function ligarControles() {
    document.getElementById('idioma').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; estado.l = b.dataset.l; gravarRota(); renderTudo();
    });
    document.getElementById('periodo').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; estado.h = +b.dataset.h; gravarRota(); atualizarBotoes(); renderPainel();
    });
    document.getElementById('modo').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; estado.modo = b.dataset.m; atualizarModo(); restyle();
    });
    document.getElementById('ir-para').addEventListener('change', function (e) {
      var v = e.target.value; if (!v) return;
      selecionar({ tipo: v.slice(0, 1), id: v.slice(2) }, true); e.target.value = '';
    });
    document.getElementById('alca').addEventListener('click', function () { document.getElementById('painel').classList.toggle('aberto'); });
    document.getElementById('tema').addEventListener('click', function () { aplicarTema(temaAtual() === 'escuro' ? 'claro' : 'escuro', true); });
    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)'), siga = function (e) {
        var salvo = null; try { salvo = localStorage.getItem('mapa-tema'); } catch (x) { /* nada */ }
        if (!salvo) aplicarTema(e.matches ? 'escuro' : 'claro', false);
      };
      if (mq.addEventListener) mq.addEventListener('change', siga); else if (mq.addListener) mq.addListener(siga);
    } catch (e) { /* navegador sem matchMedia */ }
    document.getElementById('legenda-botao').addEventListener('click', function () {
      var g = document.getElementById('legenda'), aberta = g.classList.toggle('aberta');
      this.setAttribute('aria-expanded', aberta ? 'true' : 'false');
    });
    window.addEventListener('hashchange', function () { lerRota(); renderTudo(); if (estado.sel) enquadrar(estado.sel.tipo, estado.sel.id); });
  }

  function carregar(u) {
    return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  }
  Promise.all([
    carregar('data/paises.json'), carregar('data/macrorregioes.json'), carregar('data/temas.json'),
    carregar('data/noticias.json').catch(function () { return {}; }),
    carregar('geo/paises.geojson'), carregar('geo/macrorregioes.geojson'), carregar('geo/disputadas.geojson'),
    carregar('geo/zonas_guerra.geojson').catch(function () { return null; }),
    carregar('data/areas.json').catch(function () { return []; })
  ]).then(function (r) {
    D.areas = r[8] || [];
    D.areas.forEach(function (a) { D.areaPorId[a.id] = a; });
    D.paises = r[0]; D.macros = r[1]; D.temas = r[2] || [];
    D.macros.forEach(function (m) { D.macroPorId[m.id] = m; });
    D.temas.forEach(function (tm) { D.temaPorId[tm.id] = tm; });
    var n = r[3] || {};
    D.itens = n.itens || []; D.volume = n.volume || {}; D.coletados = n.paises_coletados || null;
    D.gerado = n.gerado_em || null; D.teste = !!n.teste; D.fontesConhecidas = !!n.somente_fontes_conhecidas;
    D.itens.forEach(function (it) { (D.porPais[it.pais] = D.porPais[it.pais] || []).push(it); });
    Object.keys(D.porPais).forEach(function (k) { D.porPais[k].sort(function (a, b) { return b.visto_em < a.visto_em ? -1 : 1; }); });
    calcularEscalas();
    lerRota();
    var guerraOk = r[7] && r[7].features && r[7].features.length;
    var guerraComCrimeia = guerraOk && r[7].ocupado_km2 !== undefined; // arquivo novo já soma a Crimeia e o Donbas de 2014
    var areaDoNE = {}, areaDoConflito = {};
    D.areas.forEach(function (a) { (a.ne || []).forEach(function (n) { areaDoNE[n] = a; }); if (a.deepstate) areaDoConflito[a.deepstate] = a.id; });
    // com o mapa de guerra carregado, a Crimeia e o Donbas de 2014 aparecem nele (não duas vezes)
    r[6].features = r[6].features.filter(function (f) { var a = areaDoNE[f.properties.nome_en]; return !(guerraComCrimeia && a && a.deepstate); });
    r[6].features.forEach(function (f) { var a = areaDoNE[f.properties.nome_en]; if (a) f.properties.a = a.id; });
    G.paises = tresMundos(r[4]); G.macros = tresMundos(r[5]); G.disputa = tresMundos(r[6]);
    if (guerraOk) {
      r[7].features.forEach(function (f) { f.properties.a = areaDoConflito[f.properties.conflito]; });
      G.guerra = tresMundos(r[7]);
      G.guerraMeta = { data: r[7].data, paises: r[7].paises || [], ocupado_km2: r[7].ocupado_km2, contestado_km2: r[7].contestado_km2,
        ocupado_pct: r[7].ocupado_pct, historico: r[7].historico || [] };
    }
    montarMapa(G.paises, G.macros, G.disputa);
    ligarControles();
    renderTudo();
    if (estado.sel) enquadrar(estado.sel.tipo, estado.sel.id);
  }).catch(function (e) {
    console.error(e);
    document.getElementById('painel-conteudo').appendChild(el('p', { class: 'aviso', text: T[estado.l].erro }));
  });
})();
