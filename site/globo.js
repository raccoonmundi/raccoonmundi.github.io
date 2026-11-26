/* Raccoon Mundi · Mapa geopolítico (protótipo em globo)
 * Mesmo site do mapa plano (app.js), com o mapa desenhado num globo pelo MapLibre GL JS.
 * Gerado por ferramentas/montar_globo.py a partir de app.js + ferramentas/motor_globo.js: edite esses, não este.
 * Dois níveis de clique (macrorregião e país), temas em foco, botão EN/PT e links próprios (#r=, #p=, #t=).
 */
(function () {
  'use strict';

  var T = {
    en: {
      mapa: 'MAP', titulo: 'The world through its local press', irPara: 'Go to', escolha: 'Go to…', filtroRegiao: 'Region', filtroPais: 'Country', escolhaRegiao: 'Region…', escolhaPais: 'Country…',
      filtroArea: 'Wars and disputes', escolhaArea: 'Wars and disputes…', grupoGuerras: 'At war', grupoDisputas: 'Disputed areas',
      regioes: 'Regions', paises: 'Countries', mundo: 'World', regiao: 'Region', pais: 'Country',
      tema: 'In focus', emFoco: 'IN FOCUS', ultimas: 'Latest from the local press',
      focoAria: 'Most-covered world stories', focoTipo: 'Story in focus', posFoco: function (i, n) { return i + ' of ' + n; },
      veiculosCurto: function (v) { return v === 1 ? '1 outlet' : v + ' outlets'; },
      repercussao: function (v, p) { return (v === 1 ? '1 outlet' : v + ' outlets') + ' in ' + (p === 1 ? '1 country' : p + ' countries'); },
      comoCadaPais: "How each country's press covered it", focoSumiu: 'This story is no longer in the selected period.',
      focoDica: 'Same story, grouped from the local press of different countries. The more countries and outlets, the higher it ranks.',
      noticias: function (n) { return n === 1 ? '1 story' : num(n) + ' stories'; },
      dePaises: function (m) { return m === 1 ? 'from 1 country' : 'from ' + m + ' countries'; },
      periodo: function (h) { return 'last ' + h + ' h'; },
      voltar: function (nome) { return '← ' + nome; },
      paisesDaRegiao: 'Countries', regioesMaisAtivas: 'Most active regions', destaques: 'Latest stories',
      destaquesMundo: 'Global geopolitics', nivel1: 'The country and the world', nivel2: 'At home',
      estado: 'State', estadosLocais: 'States · local news', estadosIrPara: function (p) { return 'States of ' + p; },
      noticiasLocais: function (n) { return n === 1 ? '1 local story' : num(n) + ' local stories'; },
      dicaEstado: 'Local news, in the original language, with no geopolitics filter.',
      semLocais: function (h) { return 'No local stories from this state in the last ' + h + ' h.'; },
      nivelMundoDica: 'Stories that involve more than one country.',
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
      corPor: 'Color by', corVolume: 'Volume', corTom: 'Tone', legTituloTom: 'Tone of the coverage, last 24 h',
      tomMenos: 'more negative', tomMais: 'less negative', tomMedio: function (v) { return 'tone ' + v; },
      tomPainel: function (v) { return 'Average tone of the coverage (24 h): ' + v + ' (GDELT scale, negative = more negative wording).'; },
      legSem: 'No stories', legSemColeta: 'Not collected yet', legDisputa: 'Disputed area (Natural Earth)',
      legOcupado: function (d) { return 'Military occupation (DeepStateMap, ' + d + ')'; }, legContestado: 'Contested zone', legClique: 'Click a hatched area for its news',
      areaGuerra: 'War zone', areaDisputa: 'Disputed area', areasDoPais: 'Wars and disputes', areasIrPara: 'Wars and disputes',
      paisesEnvolvidos: 'Countries involved', noticiasArea: 'News about the area', verArea: 'See the occupied area',
      semNoticiasArea: function (h) { return 'No stories about this area in the last ' + h + ' h from the countries collected so far.'; },
      ocupadoKm: function (km, pct) { return km + ' km² occupied (' + pct + ' of Ukraine)'; },
      contestadoKm: function (km) { return km + ' km² contested (grey zone)'; },
      variacao: function (v, d) { return (v > 0 ? '+' : v < 0 ? '−' : '±') + num(Math.abs(v)) + ' km² occupied since ' + d; },
      fonteGuerra: function (d) { return 'DeepStateMap, ' + d + '. Includes Crimea and the parts of Donetsk and Luhansk occupied since 2014.'; },
      dicaArea: 'click for news', quemDisputa: 'Disputed by', emGuerra: 'At war', quemControla: 'Who controls it', porque: 'Why',
      disputasDoPais: 'Territorial disputes involving this country',
      ocupacaoUA: function (d) { return 'Part of the territory is under Russian military occupation, according to DeepStateMap (Ukrainian front-line mapping project) on ' + d + '.'; },
      creditoGuerra: 'Occupied areas: ',
      agora: 'just now', ha: function (n, u) { return n + ' ' + u + ' ago'; }, u: { m: 'min', h: 'h', d: 'd' },
      erro: 'Could not load the map data. Try reloading the page.', expandir: 'Expand panel', legenda: 'Legend', modoEscuro: 'Dark mode'
    },
    pt: {
      mapa: 'MAPA', titulo: 'O mundo pela imprensa local', irPara: 'Ir para', escolha: 'Ir para…', filtroRegiao: 'Região', filtroPais: 'País', escolhaRegiao: 'Região…', escolhaPais: 'País…',
      filtroArea: 'Guerras e disputas', escolhaArea: 'Guerras e disputas…', grupoGuerras: 'Em guerra', grupoDisputas: 'Áreas disputadas',
      regioes: 'Regiões', paises: 'Países', mundo: 'Mundo', regiao: 'Região', pais: 'País',
      tema: 'Em foco', emFoco: 'EM FOCO', ultimas: 'O mais recente da imprensa local',
      focoAria: 'Notícias do mundo mais repercutidas', focoTipo: 'Notícia em foco', posFoco: function (i, n) { return i + ' de ' + n; },
      veiculosCurto: function (v) { return v === 1 ? '1 veículo' : v + ' veículos'; },
      repercussao: function (v, p) { return (v === 1 ? '1 veículo' : v + ' veículos') + ' em ' + (p === 1 ? '1 país' : p + ' países'); },
      comoCadaPais: 'Como a imprensa de cada país noticiou', focoSumiu: 'Esta notícia saiu do período escolhido.',
      focoDica: 'A mesma história, juntada da imprensa local de vários países. Quanto mais países e veículos, mais alto fica.',
      noticias: function (n) { return n === 1 ? '1 notícia' : num(n) + ' notícias'; },
      dePaises: function (m) { return m === 1 ? 'de 1 país' : 'de ' + m + ' países'; },
      periodo: function (h) { return 'últimas ' + h + ' h'; },
      voltar: function (nome) { return '← ' + nome; },
      paisesDaRegiao: 'Países', regioesMaisAtivas: 'Regiões mais ativas', destaques: 'Notícias recentes',
      destaquesMundo: 'Geopolítica global', nivel1: 'O país e o mundo', nivel2: 'Dentro do país',
      estado: 'Estado', estadosLocais: 'Estados · notícias locais', estadosIrPara: function (p) { return 'Estados: ' + p; },
      noticiasLocais: function (n) { return n === 1 ? '1 notícia local' : num(n) + ' notícias locais'; },
      dicaEstado: 'Notícias locais, no idioma original, sem filtro geopolítico.',
      semLocais: function (h) { return 'Nenhuma notícia local deste estado nas últimas ' + h + ' h.'; },
      nivelMundoDica: 'Notícias que envolvem mais de um país.',
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
      corPor: 'Cor por', corVolume: 'Quantidade', corTom: 'Tom', legTituloTom: 'Tom da cobertura, últimas 24 h',
      tomMenos: 'mais negativo', tomMais: 'menos negativo', tomMedio: function (v) { return 'tom ' + v; },
      tomPainel: function (v) { return 'Tom médio da cobertura (24 h): ' + v + ' (escala do GDELT; negativo = linguagem mais negativa).'; },
      legSem: 'Sem notícias', legSemColeta: 'Ainda sem coleta', legDisputa: 'Área disputada (Natural Earth)',
      legOcupado: function (d) { return 'Ocupação militar (DeepStateMap, ' + d + ')'; }, legContestado: 'Zona contestada', legClique: 'Clique numa área hachurada para ver as notícias',
      areaGuerra: 'Área em guerra', areaDisputa: 'Área disputada', areasDoPais: 'Guerras e disputas', areasIrPara: 'Guerras e disputas',
      paisesEnvolvidos: 'Países envolvidos', noticiasArea: 'Notícias sobre a área', verArea: 'Ver a área ocupada',
      semNoticiasArea: function (h) { return 'Nenhuma notícia sobre a área nas últimas ' + h + ' h, entre os países coletados até agora.'; },
      ocupadoKm: function (km, pct) { return km + ' km² ocupados (' + pct + ' da Ucrânia)'; },
      contestadoKm: function (km) { return km + ' km² em zona contestada'; },
      variacao: function (v, d) { return (v > 0 ? '+' : v < 0 ? '−' : '±') + num(Math.abs(v)) + ' km² ocupados desde ' + d; },
      fonteGuerra: function (d) { return 'DeepStateMap, ' + d + '. Inclui a Crimeia e as partes de Donetsk e Luhansk ocupadas desde 2014.'; },
      dicaArea: 'clique para ver as notícias', quemDisputa: 'Quem disputa', emGuerra: 'Em guerra', quemControla: 'Quem controla hoje', porque: 'Por quê',
      disputasDoPais: 'Disputas territoriais envolvendo o país',
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
      tons: ['#a8352c', '#dc8a76', '#eee5d9', '#93c3bf', '#2f8580'],
      zero: '#e9e3d7', semColeta: '#dcd7ce', semRegiao: '#e4dfd6', amostraBorda: '#d6cfc2',
      bordaRegiao: '#ffffff', bordaMacro: '#ffffff', bordaPais: '#7d776c', bordaEstado: 'rgba(255,255,255,0.95)',
      destaque: '#1f2a33', sombra: '#1f2a33', sombraOp: 0.45,
      disputa: '#2b3a44', disputaFundo: 'rgba(255,255,255,0.35)',
      guerra: '#8f1d0d', guerraFundo: 'rgba(143,29,13,0.16)', contestFundo: 'rgba(143,29,13,0.06)',
      legDisputa: 'repeating-linear-gradient(45deg,#efe9df 0 3px,#2b3a44 3px 4.5px);border:1px dashed #2b3a44',
      legOcupado: 'repeating-linear-gradient(-45deg,#f1d9d2 0 3px,#8f1d0d 3px 5px);border:1px solid #8f1d0d',
      legContestado: 'repeating-linear-gradient(-45deg,#f7ece8 0 2px,#c08070 2px 3px);border:1px dashed #8f1d0d'
    },
    escuro: {
      cores: ['#4b3126', '#713c23', '#9d4b23', '#cc602b', '#f3874e'],
      tons: ['#d2604f', '#8a4a40', '#3b4046', '#3e706c', '#6ec0b8'],
      zero: '#2c333a', semColeta: '#20272e', semRegiao: '#262d34', amostraBorda: '#454f58',
      bordaRegiao: '#111820', bordaMacro: '#0d151b', bordaPais: '#5b656e', bordaEstado: 'rgba(13,21,27,0.95)',
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
  var VISTAS_PAIS = { 'US': [[40, -98], 3], 'RU': [[62, 95], 2.5], 'NZ': [[-41, 173], 4.5], 'FJ': [[-17.8, 178], 6], 'FR': [[46.6, 2.4], 5] };
  var LIMIAR_PAISES = 4;

  var estado = { l: 'en', h: 24, modo: 'regioes', sel: null, cor: 'volume' };
  var LIMITES_TOM = [-4, -3, -2, -1];
  var D = { paises: {}, macros: [], macroPorId: {}, temas: [], temaPorId: {}, areas: [], areaPorId: {}, estados: {}, estadoPorId: {}, itens: [], porPais: {},
            volume: {}, coletados: null, gerado: null, teste: false };
  var camadaGuerra = null, camadaEstados = null;
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
  function itensDoEstado(id) {
    return D.itens.filter(function (i) { return i.nivel === 3 && i.estado === id && noPeriodo(i); })
      .sort(function (a, b) { return b.visto_em < a.visto_em ? -1 : 1; });
  }
  function paisDaSelecao() { // país cujos estados aparecem no mapa (piloto: Brasil)
    var s = estado.sel; if (!s) return null;
    var k = s.tipo === 'p' ? s.id : s.tipo === 'e' ? D.estadoPorId[s.id].pais : null;
    return k && D.estados[k] ? k : null;
  }
  function nomeArea(a) { return estado.l === 'pt' ? a.nome_pt : a.nome_en; }
  function campoArea(a, k) { return estado.l === 'pt' ? a[k + '_pt'] : (a[k + '_en'] || a[k + '_pt']); }
  function itensDaArea(id) { // notícias que citam o lugar e, numa guerra, as do tema em foco ligado a ela
    var tema = (D.areaPorId[id] || {}).tema;
    return D.itens.filter(function (i) { return i.nivel !== 3 && ((i.areas || []).indexOf(id) >= 0 || (tema && (i.temas || []).indexOf(tema) >= 0)) && noPeriodo(i); })
      .sort(function (a, b) { return b.visto_em < a.visto_em ? -1 : 1; });
  }
  function nomeTema(tm) { return estado.l === 'pt' ? (tm.nome_pt || tm.nome_en) : (tm.nome_en || tm.nome_pt); }

  /* ---------- dados ---------- */
  function referencia() { return D.gerado ? Date.parse(D.gerado) : Date.now(); }
  function noPeriodo(it) { return Date.parse(it.visto_em) >= referencia() - estado.h * 3600e3; }
  function itensDe(isos) {
    var out = [];
    isos.forEach(function (iso) { (D.porPais[iso] || []).forEach(function (it) { if (noPeriodo(it) && it.nivel !== 3) out.push(it); }); });
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
  function textoHover(k, r) { // nome + notícias (+ tom, no modo de cor por tom)
    var tom = estado.cor === 'tom' ? (estado.modo === 'regioes' ? tomRegiao(r) : (coletado(k) ? D.tom[k] : null)) : null;
    var sufixo = tom === null || tom === undefined ? '' : ' · ' + t('tomMedio')(fmtTom(tom));
    if (estado.modo === 'regioes') { var vr = volRegiao(r); return nomeRegiao(r) + (vr === null ? '' : ' · ' + t('noticias')(vr)) + sufixo; }
    var vp = coletado(k) ? (volPais(k) || 0) : null;
    return nomePais(k) + (vp === null ? '' : ' · ' + t('noticias')(vp)) + sufixo;
  }
  function tomRegiao(id) { // média dos países da região, pesada pela quantidade de notícias
    var r = D.macroPorId[id], s = 0, n = 0;
    r.paises.forEach(function (iso) { var t = D.tom[iso], v = volPais(iso) || 0; if (t !== undefined && v) { s += t * v; n += v; } });
    return n ? s / n : null;
  }
  function corTom(v) {
    if (v === null || v === undefined) return P.semColeta;
    for (var i = 0; i < LIMITES_TOM.length; i++) if (v <= LIMITES_TOM[i]) return P.tons[i];
    return P.tons[P.tons.length - 1];
  }
  /* cor de um país (modo Países) ou da região dele (modo Regiões), por quantidade ou por tom */
  function corDoValor(k, r) {
    if (estado.cor === 'tom') return estado.modo === 'regioes' ? corTom(tomRegiao(r)) : corTom(coletado(k) ? D.tom[k] : null);
    return estado.modo === 'regioes' ? cor(volRegiao(r), LIMITES_REGIAO) : cor(coletado(k) ? (volPais(k) || 0) : null, LIMITES_PAIS);
  }
  function fmtTom(v) { return (v > 0 ? '+' : '') + Number(v).toLocaleString(estado.l === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function calcularEscalas() {
    var ts = Object.keys(D.tom).filter(coletado).map(function (k) { return D.tom[k]; }).sort(function (a, b) { return a - b; });
    if (ts.length >= 5) LIMITES_TOM = [0.2, 0.4, 0.6, 0.8].map(function (q) { return ts[Math.floor(q * (ts.length - 1))]; });
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

  /* ---------- em foco: as notícias do mundo mais repercutidas ----------
     Junta as matérias (níveis 1 e 2) que contam a mesma história: títulos em inglês parecidos, com mais peso
     para nomes próprios, números e palavras raras no período. A história sobe pelos países e veículos que
     noticiaram; precisa ter ao menos uma matéria do nível 1 (Mundo). As 5 primeiras passam na esteira. */
  var PARADA = {};
  ('a an the of to in on for and or but with at by from as is are was were be been has have had will would could should may might can it its ' +
   'this that these those after before over under into amid about against than then their his her they them he she we our you your not no new ' +
   'says said say more most up out off what who why how when where which while just also first last two three one year years day days week news ' +
   'report reports via per vs within during least people xinhua').split(' ').forEach(function (w) { PARADA[w] = 1; });
  function palavrasDoTitulo(txt) {
    var out = {}, pal = (txt || '').match(/[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9'’.\-]*/g) || [];
    pal.forEach(function (x, k) {
      var b = x.toLowerCase().replace(/['’]s$/, '').replace(/^['’.\-]+|['’.\-]+$/g, '');
      if (b === 'u.s' || b === 'us' || b === 'usa') b = 'united';
      if (b === 'states' || b.length < 3 || PARADA[b]) return;
      if (b.length > 4 && b.charAt(b.length - 1) === 's') b = b.slice(0, -1);
      out[b] = (k > 0 && /^[A-ZÀ-Þ]/.test(x)) || /^[0-9]/.test(x) ? 1.5 : 1;
    });
    return out;
  }
  // países citados nos títulos (nome em inglês e português, e alguns atalhos comuns nas manchetes)
  var ATALHOS_PAIS = { 'U.S.': 'US', 'US': 'US', 'USA': 'US', 'American': 'US', 'Washington': 'US', 'Trump': 'US', 'Pentagon': 'US', 'White House': 'US',
    'Russian': 'RU', 'Moscow': 'RU', 'Kremlin': 'RU', 'Putin': 'RU', 'Chinese': 'CN', 'Beijing': 'CN', 'Xi': 'CN',
    'Ukrainian': 'UA', 'Kyiv': 'UA', 'Kiev': 'UA', 'Zelensky': 'UA', 'Zelenskyy': 'UA', 'Iranian': 'IR', 'Tehran': 'IR',
    'Israeli': 'IL', 'Netanyahu': 'IL', 'Gaza': 'PS', 'Palestinian': 'PS', 'Saudi': 'SA', 'Riyadh': 'SA', 'Egyptian': 'EG', 'Cairo': 'EG', 'Giza': 'EG',
    'Indian': 'IN', 'New Delhi': 'IN', 'Modi': 'IN', 'Brazilian': 'BR', 'Lula': 'BR', 'German': 'DE', 'Berlin': 'DE', 'Nigerian': 'NG', 'Abuja': 'NG',
    'Houthis': 'YE', 'Houthi': 'YE', 'Yemeni': 'YE', 'Syrian': 'SY', 'Lebanese': 'LB', 'Hezbollah': 'LB', 'Turkish': 'TR', 'Japanese': 'JP', 'Tokyo': 'JP',
    'British': 'GB', 'London': 'GB', 'UK': 'GB', 'French': 'FR', 'Paris': 'FR', 'Macron': 'FR', 'Taiwanese': 'TW', 'Taipei': 'TW',
    'North Korea': 'KP', 'Pyongyang': 'KP', 'South Korea': 'KR', 'Seoul': 'KR', 'Pakistani': 'PK', 'Venezuelan': 'VE', 'Mexican': 'MX',
    'Abkhazia': 'GE', 'South Ossetia': 'GE', 'Georgian': 'GE' };
  var buscaPais = null;
  function paisesCitados(txt) {
    if (!buscaPais) {
      buscaPais = [];
      var junta = function (nome, k) { if (nome && nome.length > 2) buscaPais.push({ k: k, re: new RegExp('(^|[^A-Za-zÀ-ÿ])' + nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-zÀ-ÿ])') }); };
      Object.keys(D.paises).forEach(function (k) { var p = D.paises[k]; if (p.r) { junta(p.nome_en, k); junta(p.nome_pt, k); } });
      Object.keys(ATALHOS_PAIS).forEach(function (a) { if (D.paises[ATALHOS_PAIS[a]]) junta(a, ATALHOS_PAIS[a]); });
    }
    var achou = {};
    buscaPais.forEach(function (b) { if (b.re.test(txt)) achou[b.k] = 1; });
    return Object.keys(achou);
  }
  var cacheFoco = { chave: null, lista: [] };
  function historias() {
    var chave = estado.h + '|' + D.itens.length + '|' + D.gerado;
    if (cacheFoco.chave === chave) return cacheFoco.lista;
    var its = D.itens.filter(function (i) { return (i.nivel === 1 || i.nivel === 2) && noPeriodo(i); });
    var df = {}, n = its.length;
    var pal = its.map(function (i) { var w = palavrasDoTitulo(i.titulo_en || i.titulo_original); Object.keys(w).forEach(function (k) { df[k] = (df[k] || 0) + 1; }); return w; });
    var pesos = pal.map(function (w) {
      var o = { w: {}, s: 0 };
      Object.keys(w).forEach(function (k) { o.w[k] = w[k] * Math.log((n + 1) / (df[k] + 0.5)); o.s += o.w[k]; });
      return o;
    });
    var sim = function (a, b) {
      var sh = 0; Object.keys(a.w).forEach(function (k) { if (b.w[k] !== undefined) sh += Math.min(a.w[k], b.w[k]); });
      return [sh, sh / Math.max(1e-9, Math.min(a.s, b.s))];
    };
    var ordem = its.map(function (x, k) { return k; }).sort(function (a, b) { return its[a].visto_em < its[b].visto_em ? 1 : its[a].visto_em > its[b].visto_em ? -1 : 0; });
    var grupos = [];
    ordem.forEach(function (k) { // entra no grupo mais parecido: média de semelhança ≥ 0,3 e ao menos um par forte
      var melhor = null, bs = 0;
      grupos.forEach(function (g) {
        var soma = 0, forte = 0;
        g.forEach(function (j) { var r = sim(pesos[k], pesos[j]); soma += r[1]; if (r[0] > forte) forte = r[0]; });
        var media = soma / g.length;
        if (forte >= 5 && media >= 0.3 && media > bs) { melhor = g; bs = media; }
      });
      if (melhor) melhor.push(k); else grupos.push([k]);
    });
    var lista = grupos.map(function (g) {
      var membros = g.map(function (k) { return its[k]; });
      if (!membros.some(function (i) { return i.nivel === 1; })) return null;
      var fontes = {}, veiculos = {}, citados = {};
      membros.forEach(function (i) {
        fontes[i.pais] = (fontes[i.pais] || 0) + 1; veiculos[i.veiculo] = 1;
        paisesCitados(i.titulo_en || '').forEach(function (k) { citados[k] = (citados[k] || 0) + 1; });
      });
      var mk = g[0], ms = -1; // manchete: a matéria do nível 1 mais parecida com as demais
      g.forEach(function (k) {
        if (its[k].nivel !== 1) return;
        var s2 = 0; g.forEach(function (j) { if (j !== k) s2 += sim(pesos[k], pesos[j])[1]; });
        if (s2 > ms) { ms = s2; mk = k; }
      });
      var minimo = Math.max(1, Math.ceil(membros.length * 0.3));
      var envolvidos = Object.keys(citados).filter(function (k) { return citados[k] >= minimo; }).sort(function (a, b) { return citados[b] - citados[a]; });
      var paisesFonte = Object.keys(fontes).sort(function (a, b) { return fontes[b] - fontes[a] || nomePais(a).localeCompare(nomePais(b)); });
      return { id: its[mk].id, manchete: its[mk], itens: membros, paisesFonte: paisesFonte, nVeiculos: Object.keys(veiculos).length,
        envolvidos: envolvidos, pontos: 2 * paisesFonte.length + Object.keys(veiculos).length, recente: membros[0].visto_em };
    }).filter(Boolean);
    lista.sort(function (a, b) { return b.pontos - a.pontos || (a.recente < b.recente ? 1 : -1); });
    cacheFoco = { chave: chave, lista: lista };
    return lista;
  }
  function historiasFoco() { // as 5 da esteira; sem repercussão suficiente, completa com as do Mundo mais recentes de outros países
    var top = [], vistos = {};
    historias().forEach(function (h) {
      if (top.length >= 5) return;
      if (h.nVeiculos < 2 && vistos[h.paisesFonte[0]]) return;
      top.push(h); vistos[h.paisesFonte[0]] = 1;
    });
    return top;
  }
  function historiaPorId(id) {
    var hs = historias();
    for (var i = 0; i < hs.length; i++) if (hs[i].id === id || hs[i].itens.some(function (x) { return x.id === id; })) return hs[i];
    return null;
  }
  function paisesDoGrupo(s) { // tema ou notícia em foco: países destacados no mapa
    if (!s) return null;
    if (s.tipo === 't') return (D.temaPorId[s.id] || {}).paises || [];
    if (s.tipo === 'n') { var h = historiaPorId(s.id); return h ? (h.envolvidos.length ? h.envolvidos : h.paisesFonte) : []; }
    return null;
  }
  function tituloExib(it) { return estado.l === 'pt' ? (it.titulo_pt || it.titulo_en || it.titulo_original) : (it.titulo_en || it.titulo_original); }

  /* ---------- rota (#r= #p= #t= #n= &l= &h=) ---------- */
  function lerRota() {
    var q = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (q.get('l') === 'pt' || q.get('l') === 'en') estado.l = q.get('l');
    estado.cor = q.get('c') === 'tom' ? 'tom' : 'volume';
    if (['12', '24', '48'].indexOf(q.get('h')) >= 0) estado.h = +q.get('h');
    if (q.get('e') && D.estadoPorId[q.get('e')]) estado.sel = { tipo: 'e', id: q.get('e') };
    else if (q.get('a') && D.areaPorId[q.get('a')]) estado.sel = { tipo: 'a', id: q.get('a') };
    else if (q.get('t') && D.temaPorId[q.get('t')]) estado.sel = { tipo: 't', id: q.get('t') };
    else if (q.get('n') && historiaPorId(q.get('n'))) estado.sel = { tipo: 'n', id: q.get('n') };
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
    if (estado.cor === 'tom') q.set('c', 'tom');
    var h = q.toString();
    history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
  }

  /* ---------- mapa em globo (MapLibre GL JS) ----------
     Mesmo conteúdo do mapa plano, desenhado num globo: de longe aparece o planeta, de perto vira mapa plano.
     O zoom do MapLibre (blocos de 512 px) fica 1 abaixo do zoom do Leaflet usado nos valores herdados. */
  var mapa = null, MAPA_PRONTO = false, DZ = 1, ultimaChaveRotulos = '';
  var VAZIO = { type: 'FeatureCollection', features: [] };
  var regiaoDoPais = {}; // k -> r, para pintar cada país pelo estado da feição
  var hover = { pais: null, area: null, estado: null };
  /* Teste do 3D: a seleção sobe do globo (extrusão) e a câmera inclina para mostrar o relevo.
     globo.html?3d=0 volta ao destaque plano (sombra, área erguida e contorno). */
  var TRES_D = !/[?&]3d=0(&|$)/.test(location.search), INCLINACAO = 40;
  // altura da extrusão em metros, caindo pela metade a cada nível de zoom: fica com ~9 px em qualquer zoom
  // (um degrau por nível; o "exponential" do MapLibre não divide o valor, só acelera a transição)
  var ALTURA = ['interpolate', ['linear'], ['zoom']].concat([0, 1, 2, 3, 4, 5, 6, 7, 8].reduce(function (a, z) { return a.concat([z, 700000 / Math.pow(2, z)]); }, []));
  function tom(hex, i) { // varia um pouco o tom de áreas vizinhas da mesma cor, para a divisa aparecer no 3D
    var f = [0, 0.08, -0.07, 0.04][i % 4], m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m || !f) return hex;
    var n = parseInt(m[1], 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      return Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f))));
    });
    return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  }

  function tresMundos(fc) { return fc; } // o globo já é contínuo: não precisa repetir o mundo

  /* Dia e noite pelo horário real. O relógio do aparelho é corrigido pela hora do servidor do site
     (cabeçalho Date da resposta), e a sombra da noite é redesenhada a cada minuto.
     globo.html?noite=0 desliga. */
  var NOITE = !/[?&]noite=0(&|$)/.test(location.search), desvioRelogio = 0;
  function agoraReal() { return new Date(Date.now() + desvioRelogio); }
  function sincronizarRelogio() {
    var antes = Date.now();
    return fetch('data/paises.json', { method: 'HEAD', cache: 'no-store' }).then(function (r) {
      var d = Date.parse(r.headers.get('Date') || '');
      if (d) desvioRelogio = d + (Date.now() - antes) / 2 - Date.now();
    }).catch(function () { /* sem resposta: fica o relógio do aparelho */ });
  }
  function posicaoSol(d) { // aproximação da NOAA: ponto da Terra onde o sol está a pino
    var dia = (d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5;
    var g = 2 * Math.PI / 365 * dia;
    var eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
      - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var min = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
    var lon = -15 * ((min + eqt) / 60 - 12);
    return { lat: dec * 180 / Math.PI, lon: ((lon % 360) + 540) % 360 - 180 };
  }
  function areaNoite(sol) { // lado da Terra sem sol: além da linha onde o sol está no horizonte
    var r = Math.PI / 180, tanDec = Math.tan((Math.abs(sol.lat) < 0.01 ? 0.01 : sol.lat) * r), pts = [];
    for (var lon = -180; lon <= 180; lon += 2) pts.push([lon, Math.atan(-Math.cos((lon - sol.lon) * r) / tanDec) / r]);
    var polo = sol.lat > 0 ? -90 : 90;
    var linha = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts.slice() } };
    pts.push([180, polo], [-180, polo], pts[0]);
    return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { tipo: 'noite' }, geometry: { type: 'Polygon', coordinates: [pts] } },
      Object.assign(linha, { properties: { tipo: 'linha' } })] };
  }
  var relogio = null;
  function atualizarNoite() {
    if (!NOITE || !MAPA_PRONTO) return;
    var agora = agoraReal();
    mapa.getSource('noite').setData(areaNoite(posicaoSol(agora)));
    if (!relogio) { relogio = el('div', { class: 'relogio-mapa' }); document.getElementById('mapa').appendChild(relogio); }
    var h = new Intl.DateTimeFormat(estado.l === 'pt' ? 'pt-BR' : 'en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(agora);
    relogio.textContent = (estado.l === 'pt' ? 'Dia e noite agora · ' + h + ' em Brasília' : 'Day and night now · ' + h + ' Brasília time');
    if (typeof agendarMonumentos === 'function') agendarMonumentos(); // a luz dos monumentos segue o horário
  }
  function base() { return location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, ''); }
  function pequeno() { return window.innerWidth < 820; }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  function corDoPais(k) {
    var r = regiaoDoPais[k], grupo = paisesDoGrupo(estado.sel);
    if (!r) return { cor: P.semRegiao, op: 1 };
    var c = corDoValor(k, r);
    return { cor: c, op: grupo && grupo.indexOf(k) < 0 ? 0.35 : 1 };
  }
  function estiloDisputa() { return { color: P.disputa, weight: 1.1 }; }
  function estiloGuerra(f) { return { color: P.guerra, weight: f && f.properties.tipo === 'ocupado' ? 1.4 : 0.8 }; }

  /* hachuras desenhadas num canvas e usadas como padrão de preenchimento */
  function imagemHachura(tam, sobe, fundo, traco, larg, opac) {
    var px = 2, n = Math.round(tam * px), c = document.createElement('canvas'); c.width = c.height = n;
    var g = c.getContext('2d');
    g.clearRect(0, 0, n, n); g.fillStyle = fundo; g.fillRect(0, 0, n, n);
    g.globalAlpha = opac; g.strokeStyle = traco; g.lineWidth = larg * px; g.lineCap = 'square';
    g.beginPath();
    for (var i = -n; i <= n; i += n) {
      if (sobe) { g.moveTo(i, n); g.lineTo(i + n, 0); } else { g.moveTo(i, 0); g.lineTo(i + n, n); }
    }
    g.stroke();
    return g.getImageData(0, 0, n, n);
  }
  function imagens() {
    return {
      'hachura': imagemHachura(7, true, P.disputaFundo, P.disputa, 1.3, 0.75),
      'hachura-guerra': imagemHachura(8, false, P.guerraFundo, P.guerra, 1.9, 0.85),
      'hachura-contestada': imagemHachura(5, false, P.contestFundo, P.guerra, 0.8, 0.5)
    };
  }
  function criarHachura() {
    if (!mapa) return;
    var im = imagens();
    Object.keys(im).forEach(function (id) {
      if (mapa.hasImage(id)) mapa.updateImage(id, im[id]); else mapa.addImage(id, im[id], { pixelRatio: 2 });
    });
  }

  function estiloDoMapa() {
    return {
      version: 8,
      projection: { type: 'globe' },
      light: { anchor: 'viewport', color: '#ffffff', intensity: 0.45, position: [1.3, 200, 35] },
      sky: { 'atmosphere-blend': 0 }, // sem o brilho de atmosfera: parecia luz do sol, sem seguir o horário real
      glyphs: base() + 'fonts/{fontstack}/{range}.pbf',
      sources: {
        paises: { type: 'geojson', data: G.paises, promoteId: 'k' },
        macros: { type: 'geojson', data: G.macros },
        disputa: { type: 'geojson', data: G.disputa || VAZIO },
        guerra: { type: 'geojson', data: G.guerra || VAZIO },
        estados: { type: 'geojson', data: G.estados || VAZIO },
        selPreench: { type: 'geojson', data: VAZIO },
        noite: { type: 'geojson', data: VAZIO },
        selContorno: { type: 'geojson', data: VAZIO },
        monumentos: { type: 'geojson', data: VAZIO },
        rotulos: { type: 'geojson', data: VAZIO }
      },
      layers: [
        { id: 'oceano', type: 'background', paint: { 'background-color': css('--oceano') } },
        { id: 'paises', type: 'fill', source: 'paises',
          paint: { 'fill-color': ['coalesce', ['feature-state', 'cor'], P.semRegiao], 'fill-opacity': ['coalesce', ['feature-state', 'op'], 1] } },
        { id: 'paises-linha', type: 'line', source: 'paises', layout: { 'line-join': 'round' },
          paint: { 'line-color': P.bordaRegiao, 'line-width': 0.4, 'line-opacity': 0.9 } },
        { id: 'macros-linha', type: 'line', source: 'macros', layout: { 'line-join': 'round' },
          paint: { 'line-color': P.bordaMacro, 'line-width': 1.6 } },
        { id: 'estados', type: 'fill', source: 'estados', layout: { visibility: 'none' }, paint: { 'fill-color': '#000', 'fill-opacity': 0 } },
        { id: 'disputa', type: 'fill', source: 'disputa', paint: { 'fill-pattern': 'hachura' } },
        { id: 'disputa-linha', type: 'line', source: 'disputa', paint: { 'line-color': P.disputa, 'line-width': 1.1, 'line-opacity': 0.85, 'line-dasharray': [3.5, 2.5] } },
        { id: 'guerra', type: 'fill', source: 'guerra', paint: { 'fill-pattern': ['match', ['get', 'tipo'], 'ocupado', 'hachura-guerra', 'hachura-contestada'] } },
        { id: 'guerra-linha', type: 'line', source: 'guerra',
          paint: { 'line-color': P.guerra, 'line-width': ['match', ['get', 'tipo'], 'ocupado', 1.4, 0.8], 'line-opacity': ['match', ['get', 'tipo'], 'ocupado', 0.95, 0.7] } },
        // noite pelo horário real: sombra sobre o lado sem sol, com a borda suavizada
        { id: 'noite', type: 'fill', source: 'noite', filter: ['==', ['get', 'tipo'], 'noite'], layout: { visibility: NOITE ? 'visible' : 'none' },
          paint: { 'fill-color': '#06102a', 'fill-opacity': temaAtual() === 'escuro' ? 0.42 : 0.3 } },
        { id: 'noite-borda', type: 'line', source: 'noite', filter: ['==', ['get', 'tipo'], 'linha'], layout: { visibility: NOITE ? 'visible' : 'none' },
          paint: { 'line-color': '#06102a', 'line-width': 22, 'line-blur': 18, 'line-opacity': 0.18 } },
        // destaque da seleção: sombra desfocada um pouco abaixo, preenchimento erguido e contorno escuro (como no mapa plano)
        { id: 'sel-sombra-base', type: 'fill', source: 'selContorno',
          paint: { 'fill-color': P.sombra, 'fill-opacity': P.sombraOp * 0.55, 'fill-translate': [0, 5] } },
        { id: 'sel-sombra', type: 'line', source: 'selContorno', layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': P.sombra, 'line-opacity': P.sombraOp * 0.45, 'line-width': 7, 'line-blur': 7, 'line-translate': [0, 5] } },
        { id: 'sel-cor', type: 'fill', source: 'selPreench', filter: ['!', ['has', 'padrao']],
          paint: { 'fill-color': ['get', 'cor'], 'fill-translate': [0, -2] } },
        { id: 'sel-padrao', type: 'fill', source: 'selPreench', filter: ['has', 'padrao'],
          paint: { 'fill-pattern': ['get', 'padrao'], 'fill-translate': [0, -2] } },
        { id: 'sel-interna', type: 'line', source: 'selPreench', filter: ['!', ['has', 'padrao']],
          paint: { 'line-color': ['get', 'linha'], 'line-width': ['get', 'larg'], 'line-translate': [0, -2] } },
        { id: 'estados-linha', type: 'line', source: 'estados', layout: { visibility: 'none', 'line-join': 'round' },
          paint: { 'line-color': P.bordaEstado, 'line-width': 0.9 } },
        { id: 'sel-3d', type: 'fill-extrusion', source: 'selPreench', filter: ['!', ['has', 'padrao']], layout: { visibility: TRES_D ? 'visible' : 'none' },
          paint: { 'fill-extrusion-color': ['get', 'cor'], 'fill-extrusion-height': ALTURA, 'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': true } },
        { id: 'sel-3d-padrao', type: 'fill-extrusion', source: 'selPreench', filter: ['has', 'padrao'], layout: { visibility: TRES_D ? 'visible' : 'none' },
          paint: { 'fill-extrusion-pattern': ['get', 'padrao'], 'fill-extrusion-height': ALTURA, 'fill-extrusion-base': 0, 'fill-extrusion-opacity': 1 } },
        // monumentos 3D (maquete): peças com base e topo próprios, recalculados conforme o zoom
        { id: 'monumentos', type: 'fill-extrusion', source: 'monumentos',
          paint: { 'fill-extrusion-color': ['get', 'cor'], 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-base': ['get', 'b'],
            'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': false } },
        { id: 'sel-borda', type: 'line', source: 'selContorno', layout: { 'line-join': 'round' },
          paint: { 'line-color': P.destaque, 'line-width': 2, 'line-translate': [0, -2] } },
        { id: 'hover-pais', type: 'line', source: 'paises', filter: ['==', ['get', 'k'], ''], paint: { 'line-color': P.destaque, 'line-width': 2 } },
        { id: 'hover-estado', type: 'line', source: 'estados', filter: ['==', ['get', 'id'], ''], paint: { 'line-color': P.destaque, 'line-width': 2.2 } },
        { id: 'hover-area-d', type: 'line', source: 'disputa', filter: ['==', ['get', 'a'], ''], paint: { 'line-color': P.disputa, 'line-width': 2.4 } },
        { id: 'hover-area-g', type: 'line', source: 'guerra', filter: ['==', ['get', 'a'], ''], paint: { 'line-color': P.guerra, 'line-width': 2.4 } },
        { id: 'rotulos', type: 'symbol', source: 'rotulos', filter: ['>=', ['zoom'], ['get', 'mz']],
          layout: {
            'text-field': ['step', ['zoom'], ['case', ['==', ['get', 'tipo'], 'estado'], ['get', 'uf'], ['get', 'nome']], 4, ['get', 'nome']],
            'text-font': ['Open Sans Bold'],
            'text-size': ['match', ['get', 'tipo'], 'regiao', pequeno() ? 10.5 : 12, 'estado', pequeno() ? 9 : 10, pequeno() ? 9.5 : 10.5],
            'text-letter-spacing': ['match', ['get', 'tipo'], 'regiao', 0.12, 0.07],
            'text-transform': 'uppercase', 'text-max-width': 9, 'text-line-height': 1.15,
            'symbol-sort-key': ['get', 'prio'], 'text-padding': 3,
            'text-offset': ['coalesce', ['get', 'off'], ['literal', [0, 0]]]
          },
          paint: { 'text-color': css('--rotulo'), 'text-halo-color': css('--halo'), 'text-halo-width': 1.6, 'text-halo-blur': 0.6 } }
      ]
    };
  }

  /* cores que dependem do tema (claro/escuro) */
  function aplicarModo3D() {
    ['sel-cor', 'sel-padrao', 'sel-interna', 'sel-borda'].forEach(function (id) { mapa.setLayoutProperty(id, 'visibility', TRES_D ? 'none' : 'visible'); });
  }
  function atualizarCoresMapa() {
    if (!MAPA_PRONTO) return;
    criarHachura();
    var p = function (l, k, v) { mapa.setPaintProperty(l, k, v); };
    p('oceano', 'background-color', css('--oceano'));
    p('disputa-linha', 'line-color', P.disputa); p('guerra-linha', 'line-color', P.guerra);
    p('sel-sombra', 'line-color', P.sombra); p('sel-sombra', 'line-opacity', P.sombraOp * 0.45);
    p('sel-sombra-base', 'fill-color', P.sombra); p('sel-sombra-base', 'fill-opacity', P.sombraOp * 0.55);
    p('sel-borda', 'line-color', P.destaque); p('hover-pais', 'line-color', P.destaque); p('hover-estado', 'line-color', P.destaque);
    p('hover-area-d', 'line-color', P.disputa); p('hover-area-g', 'line-color', P.guerra);
    p('estados-linha', 'line-color', P.bordaEstado);
    p('paises', 'fill-color', ['coalesce', ['feature-state', 'cor'], P.semRegiao]);
    p('rotulos', 'text-color', css('--rotulo')); p('rotulos', 'text-halo-color', css('--halo'));
    p('noite', 'fill-opacity', temaAtual() === 'escuro' ? 0.42 : 0.3);
  }

  function restyle() {
    if (!MAPA_PRONTO) return;
    Object.keys(regiaoDoPais).forEach(function (k) { mapa.setFeatureState({ source: 'paises', id: k }, corDoPais(k)); });
    var reg = estado.modo === 'regioes';
    mapa.setPaintProperty('paises-linha', 'line-color', reg ? P.bordaRegiao : P.bordaPais);
    mapa.setPaintProperty('paises-linha', 'line-width', reg ? 0.4 : 0.8);
    mapa.setPaintProperty('paises-linha', 'line-opacity', reg ? 0.9 : 0.85);
    mapa.setPaintProperty('macros-linha', 'line-color', P.bordaMacro);
    mapa.setPaintProperty('macros-linha', 'line-width', reg ? 1.6 : 1);
    atualizarEstados();
    atualizarDestaque();
    atualizarRotulos();
    atualizarNoite();
    atualizarMonumentos();
  }

  function featuresDaArea(id) {
    var a = D.areaPorId[id] || {};
    var fs = (G.disputa ? G.disputa.features : []).filter(function (f) { return f.properties.a === id; });
    if (G.guerra) fs = fs.concat(G.guerra.features.filter(function (f) { return f.properties.a === id; }));
    return a.deepstate && G.guerra ? fs.filter(function (f) { return f.properties.tipo; }) : fs;
  }
  function atualizarDestaque() {
    var s = estado.sel, preench = [], contorno = [];
    if (s) {
      if (s.tipo === 'r') {
        contorno = G.macros.features.filter(function (f) { return f.properties.r === s.id; });
        preench = G.paises.features.filter(function (f) { return f.properties.r === s.id; });
      } else if (s.tipo === 'a') {
        preench = contorno = featuresDaArea(s.id);
      } else if (s.tipo === 'e') {
        preench = contorno = (G.estados ? G.estados.features : []).filter(function (f) { return f.properties.id === s.id; });
      } else {
        var alvo = s.tipo === 'p' ? [s.id] : (paisesDoGrupo(s) || []);
        preench = contorno = G.paises.features.filter(function (f) { return alvo.indexOf(f.properties.k) >= 0; });
      }
    }
    var reg = estado.modo === 'regioes';
    // no 3D, país com estados (piloto: Brasil) sobe estado por estado, para as divisas continuarem visíveis
    if (TRES_D && s && s.tipo === 'p' && D.estados[s.id] && G.estados) {
      var corBR = corDoPais(s.id).cor;
      preench = G.estados.features.filter(function (f) { return (D.estadoPorId[f.properties.id] || {}).pais === s.id; })
        .map(function (f, i) { return { type: 'Feature', properties: { cor: tom(corBR, i) }, geometry: f.geometry }; });
    }
    var fill = preench.map(function (f, i) {
      var pr = {};
      if (f.properties.cor && !f.properties.k) return f; // já preparado (estados do país)
      if (s.tipo === 'a') pr.padrao = f.properties.tipo ? (f.properties.tipo === 'ocupado' ? 'hachura-guerra' : 'hachura-contestada') : 'hachura';
      else if (s.tipo === 'e') pr.cor = corDoPais(D.estadoPorId[s.id].pais).cor;
      else {
        pr.cor = corDoPais(f.properties.k).cor; pr.linha = reg ? P.bordaRegiao : P.bordaPais; pr.larg = reg ? 0.4 : 0.8;
        if (TRES_D && s.tipo === 'r') pr.cor = tom(pr.cor, i); // países da região: tons alternados para ver as divisas
      }
      return { type: 'Feature', properties: pr, geometry: f.geometry };
    });
    mapa.getSource('selPreench').setData({ type: 'FeatureCollection', features: fill });
    mapa.getSource('selContorno').setData({ type: 'FeatureCollection', features: contorno.map(function (f) { return { type: 'Feature', properties: {}, geometry: f.geometry }; }) });
    // com o país erguido, as linhas dos estados sobem junto (no destaque plano)
    mapa.setPaintProperty('estados-linha', 'line-translate', !TRES_D && s && s.tipo === 'p' ? [0, -2] : [0, 0]);
    if (TRES_D) { // câmera inclinada enquanto há seleção, reta no mundo inteiro
      if (s && mapa.getPitch() < 5) mapa.easeTo({ pitch: INCLINACAO, duration: 700 });
      if (!s && mapa.getPitch() > 0) mapa.easeTo({ pitch: 0, duration: 700 });
    }
  }

  function atualizarEstados() {
    var k = paisDaSelecao(), vis = k ? 'visible' : 'none';
    mapa.setLayoutProperty('estados', 'visibility', vis);
    mapa.setLayoutProperty('estados-linha', 'visibility', vis);
  }

  function ponto(ll, props) { return { type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: [ll[1], ll[0]] } }; }
  function atualizarRotulos() {
    var pe = estado.modo === 'paises' ? paisDaSelecao() : null;
    var estSel = estado.sel && estado.sel.tipo === 'e' ? estado.sel.id : '';
    var chave = estado.modo + '|' + estado.l + '|' + pe + '|' + estSel;
    if (chave === ultimaChaveRotulos) return;
    ultimaChaveRotulos = chave;
    var fs = [];
    if (estado.modo === 'regioes') {
      Object.keys(ROTULOS_REGIAO).forEach(function (id, i) {
        if (D.macroPorId[id]) fs.push(ponto(ROTULOS_REGIAO[id], { nome: nomeRegiao(id), tipo: 'regiao', prio: i, mz: 0 }));
      });
    } else {
      if (pe) D.estados[pe].forEach(function (e) {
        var temMon = MON.some(function (m) { return m.estado === e.id && (m.nivel !== 'estado' || estSel === e.id); }); // o rótulo desce para não cobrir a maquete
        fs.push(ponto([e.ly, e.lx], { nome: e.nome, uf: e.uf, tipo: 'estado', prio: 50, mz: 0, off: temMon ? [0, 1.6] : [0, 0] }));
      });
      Object.keys(D.paises).forEach(function (k) {
        var p = D.paises[k];
        if (!p.r || p.lx === undefined || k === pe) return;
        fs.push(ponto([p.ly, p.lx], { nome: nomePais(k), tipo: 'pais', prio: 100 + p.rank * 10 + p.mz, mz: p.mz - DZ + (pequeno() ? 1 : 0.3) }));
      });
    }
    mapa.getSource('rotulos').setData({ type: 'FeatureCollection', features: fs });
  }

  function rotuloHover(f) {
    var k = f.properties.k, r = f.properties.r;
    if (!r) return null;
    return textoHover(k, r);
  }

  /* ---------- monumentos 3D (maquete) ----------
     Blocos próprios em fill-extrusion, lidos de data/monumentos.json (sem modelos de terceiros).
     As medidas das peças são "unidades de tela" (≈ 1 px no zoom 3), convertidas em metros conforme o zoom:
     o monumento fica com tamanho de tela quase fixo, crescendo um pouco ao aproximar.
     Referência do país: aparece a partir do zoom de país (MapLibre ≥ 3) ou quando o país está na seleção.
     Referência de estado ("nivel": "estado", piloto Brasil): só aparece com aquele estado selecionado;
     com a seleção erguida no 3D, ficam em cima dela. À noite (horário real), ficam mais escuros.
     globo.html?monumentos=0 desliga. */
  var MONUMENTOS = !/[?&]monumentos=0(&|$)/.test(location.search), ZOOM_MONUMENTOS = 3;
  var MON = [], MON_POR_ID = {}, monDesde = {}, monQuadro = 0, monChave = '';
  function alturaSelecao(z) { // mesmo valor da expressão ALTURA (linear entre os níveis inteiros)
    z = Math.max(0, Math.min(8, z));
    var a = Math.floor(z), b = Math.min(8, a + 1), f = z - a;
    return 700000 / Math.pow(2, a) * (1 - f) + 700000 / Math.pow(2, b) * f;
  }
  function escalaMonumento(z) { return 2 * Math.pow(2, (Math.max(1.5, Math.min(7, z)) - 3) * 0.45); }
  function anelRet(x, y, w, d) { var a = w / 2, b = d / 2; return [[x - a, y - b], [x + a, y - b], [x + a, y + b], [x - a, y + b], [x - a, y - b]]; }
  function anelCirc(x, y, r, n) {
    var pts = [];
    for (var i = 0; i < n; i++) { var g = (i + 0.5) / n * 2 * Math.PI; pts.push([x + r * Math.cos(g), y + r * Math.sin(g)]); }
    pts.push(pts[0]); return pts;
  }
  function anelOcto(x, y, l, c) {
    var a = l / 2, k = a - c;
    var pts = [[x - k, y - a], [x + k, y - a], [x + a, y - k], [x + a, y + k], [x + k, y + a], [x - k, y + a], [x - a, y + k], [x - a, y - k]];
    pts.push(pts[0]); return pts;
  }
  function anelEstrela(x, y, r1, r2, n) {
    var pts = [];
    for (var i = 0; i < n * 2; i++) { var g = Math.PI / 2 + i / (n * 2) * 2 * Math.PI, r = i % 2 ? r2 : r1; pts.push([x + r * Math.cos(g), y + r * Math.sin(g)]); }
    pts.push(pts[0]); return pts;
  }
  function anelElipse(x, y, rx, ry, n, a0, a1, sentido) { // arco de elipse (graus), sem fechar
    var pts = [], ini = a0 === undefined ? 0 : a0, fim = a1 === undefined ? 360 : a1, k = Math.max(3, Math.round(n * (fim - ini) / 360));
    for (var i = 0; i <= k; i++) { var g = (sentido > 0 ? ini + (fim - ini) * i / k : fim - (fim - ini) * i / k) * Math.PI / 180; pts.push([x + rx * Math.cos(g), y + ry * Math.sin(g)]); }
    return pts;
  }
  function fechar(anel) { var a = anel[0], z = anel[anel.length - 1]; return a[0] === z[0] && a[1] === z[1] ? anel : anel.concat([a]); }
  function pecasDe(m) { // cada peça vira { aneis, b, t, c } (em unidades); o primeiro anel é o contorno, os outros são furos
    if (m._pecas) return m._pecas;
    var out = [];
    (m.pecas || []).forEach(function (p) {
      var f = p[0];
      if (f === 'r') out.push({ aneis: [anelRet(p[1], p[2], p[3], p[4])], b: p[5], t: p[6], c: p[7] });
      else if (f === 'c') out.push({ aneis: [anelCirc(p[1], p[2], p[3], p[7] || 10)], b: p[4], t: p[5], c: p[6] });
      else if (f === 'o') out.push({ aneis: [anelOcto(p[1], p[2], p[3], p[4])], b: p[5], t: p[6], c: p[7] });
      else if (f === 'e') out.push({ aneis: [anelEstrela(p[1], p[2], p[3], p[4], p[5])], b: p[6], t: p[7], c: p[8] });
      else if (f === 'p') out.push({ aneis: p[1].map(fechar), b: p[2], t: p[3], c: p[4] });
      else if (f === 'a') { // anel elíptico [a, x, y, rx, ry, rx interno, ry interno, base, topo, cor, lados, ângulo inicial, ângulo final]
        var n = p[10] || 24, setor = p[11] !== undefined;
        if (!setor) {
          var fora = fechar(anelElipse(p[1], p[2], p[3], p[4], n, 0, 360, 1).slice(0, -1));
          out.push({ aneis: p[5] > 0 ? [fora, fechar(anelElipse(p[1], p[2], p[5], p[6], n, 0, 360, -1).slice(0, -1))] : [fora], b: p[7], t: p[8], c: p[9] });
        } else {
          var arco = anelElipse(p[1], p[2], p[3], p[4], n, p[11], p[12], 1);
          arco = arco.concat(p[5] > 0 ? anelElipse(p[1], p[2], p[5], p[6], n, p[11], p[12], -1) : [[p[1], p[2]]]);
          out.push({ aneis: [fechar(arco)], b: p[7], t: p[8], c: p[9] });
        }
      } else if (f === 'deg') { // pirâmide em degraus: cada degrau é um bloco um pouco menor
        var nd = p[4], h = p[5] / nd, b0 = p[8] || 0;
        for (var i = 0; i < nd; i++) { var l = p[3] * (1 - i / nd); out.push({ aneis: [anelRet(p[1], p[2], l, l)], b: b0 + i * h, t: b0 + (i + 1) * h, c: i % 2 && p[7] ? p[7] : p[6] }); }
      }
    });
    var raio = 0; // alcance da maquete a partir do ponto (para não encavalar com a vizinha)
    out.forEach(function (q) { q.aneis[0].forEach(function (pt) { raio = Math.max(raio, Math.sqrt(pt[0] * pt[0] + pt[1] * pt[1])); }); });
    m._raio = raio; // em unidades (a escala do monumento entra em kmPorUnidade)
    return (m._pecas = out);
  }
  function distanciaKm(a, b) {
    var r = Math.PI / 180, dl = (b.lat - a.lat) * r, dg = (b.lon - a.lon) * r;
    var h = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dg / 2) * Math.sin(dg / 2);
    return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function kmPorUnidade(m, z) { return 40075.016686 * Math.cos(m.lat * Math.PI / 180) / (512 * Math.pow(2, z)) * escalaMonumento(z) * (m.escala || 1); }
  function escurecer(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { return ('0' + Math.round(v * k).toString(16)).slice(-2); }).join('');
  }
  function luzDoLugar(m, sol) { // 1 de dia; mais escuro à noite, com crepúsculo entre o sol a −6° e a +4°
    if (!sol) return 1;
    var r = Math.PI / 180;
    var alt = Math.asin(Math.sin(m.lat * r) * Math.sin(sol.lat * r) + Math.cos(m.lat * r) * Math.cos(sol.lat * r) * Math.cos((m.lon - sol.lon) * r)) / r;
    return 0.68 + 0.32 * Math.max(0, Math.min(1, (alt + 6) / 10)); // à noite, ~o mesmo escurecimento da sombra do mapa
  }
  function selecaoDosMonumentos() { // países da seleção e o que está erguido no 3D
    var s = estado.sel;
    if (!s) return { paises: [], estado: null };
    if (s.tipo === 'p') return { paises: [s.id], estado: null };
    if (s.tipo === 'e') return { paises: [], estado: s.id, pais: (D.estadoPorId[s.id] || {}).pais };
    if (s.tipo === 'r') return { paises: Object.keys(regiaoDoPais).filter(function (k) { return regiaoDoPais[k] === s.id; }), estado: null };
    if (s.tipo === 't' || s.tipo === 'n') return { paises: paisesDoGrupo(s) || [], estado: null };
    return { paises: [], estado: null };
  }
  function atualizarMonumentos() {
    if (!MAPA_PRONTO || !MON.length || !mapa.getSource('monumentos')) return;
    var z = Math.round(mapa.getZoom() * 20) / 20, agora = performance.now(), sel = selecaoDosMonumentos();
    var sol = NOITE ? posicaoSol(agoraReal()) : null, escuro = temaAtual() === 'escuro', animando = false, lista = [];
    var c = mapa.getCenter(), centro = { lat: c.lat, lon: c.lng }, cv = mapa.getCanvas();
    var alcance = Math.sqrt(cv.clientWidth * cv.clientWidth + cv.clientHeight * cv.clientHeight) * 0.75 * 40075.016686 / (512 * Math.pow(2, z)); // km até a borda da tela, com folga
    var candidatos = [];
    MON.forEach(function (m) {
      pecasDe(m);
      var naSelecao = sel.paises.indexOf(m.pais) >= 0 || sel.pais === m.pais;
      var ligado = m.nivel === 'estado' ? sel.estado === m.estado : (z >= ZOOM_MONUMENTOS || naSelecao);
      if (ligado && !(m.nivel === 'estado' || sel.estado === m.estado) && distanciaKm(centro, m) > alcance) ligado = false; // fora da vista
      if (MONUMENTOS && ligado) candidatos.push({ m: m, sel: m.nivel === 'estado' || naSelecao ? 0 : 1 });
    });
    candidatos.sort(function (a, b) { return a.sel - b.sel || (a.m.prio || 5) - (b.m.prio || 5); });
    var aceitos = [];
    candidatos.forEach(function (x) {
      var m = x.m, livre = aceitos.every(function (o) { return distanciaKm(m, o) > (m._raio * kmPorUnidade(m, z) + o._raio * kmPorUnidade(o, z)) * 0.85; });
      if (livre) aceitos.push(m);
    });
    MON.forEach(function (m) {
      if (aceitos.indexOf(m) < 0) { delete monDesde[m.id]; return; }
      if (!monDesde[m.id]) monDesde[m.id] = agora;
      var f = Math.min(1, (agora - monDesde[m.id]) / 450);
      if (f < 1) animando = true;
      var erguido = TRES_D && (sel.estado ? sel.estado === m.estado : sel.paises.indexOf(m.pais) >= 0);
      lista.push({ m: m, cresce: 1 - Math.pow(1 - f, 3), base: erguido ? alturaSelecao(z) : 0, luz: Math.round(luzDoLugar(m, sol) * (escuro ? 0.88 : 1) * 40) / 40 });
    });
    var chave = z + '|' + lista.map(function (x) { return x.m.id + ':' + x.cresce.toFixed(3) + ':' + Math.round(x.base) + ':' + x.luz; }).join(',');
    if (chave !== monChave) {
      monChave = chave;
      var fs = [];
      lista.forEach(function (x) {
        var m = x.m, u = kmPorUnidade(m, z) * 1000; // metros por unidade
        var kx = u / (111320 * Math.cos(m.lat * Math.PI / 180)), ky = u / 110574;
        pecasDe(m).forEach(function (p) {
          fs.push({ type: 'Feature', properties: { m: m.id, cor: x.luz < 1 ? escurecer(p.c, x.luz) : p.c, b: x.base + p.b * u * x.cresce, h: x.base + p.t * u * x.cresce },
            geometry: { type: 'Polygon', coordinates: p.aneis.map(function (a) { return a.map(function (q) { return [m.lon + q[0] * kx, m.lat + q[1] * ky]; }); }) } });
        });
      });
      mapa.getSource('monumentos').setData({ type: 'FeatureCollection', features: fs });
    }
    if (animando) agendarMonumentos();
  }
  function agendarMonumentos() {
    if (!monQuadro) monQuadro = requestAnimationFrame(function () { monQuadro = 0; atualizarMonumentos(); });
  }
  function carregarMonumentos() {
    if (!MONUMENTOS) return;
    fetch('data/monumentos.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : { monumentos: [] }; }).then(function (j) {
      MON = j.monumentos || [];
      MON.forEach(function (m) { MON_POR_ID[m.id] = m; });
      ultimaChaveRotulos = ''; atualizarRotulos();
      atualizarMonumentos();
    }).catch(function () { /* sem monumentos: o resto do mapa segue igual */ });
  }
  function monumentoEm(pt) {
    if (!MON.length || !mapa.getLayer('monumentos')) return null;
    var fs = mapa.queryRenderedFeatures(pt, { layers: ['monumentos'] });
    return fs.length ? MON_POR_ID[fs[0].properties.m] || null : null;
  }
  function textoMonumento(m) {
    return el('div', {}, [el('strong', { text: estado.l === 'pt' ? m.nome_pt : m.nome_en }), el('br'), estado.l === 'pt' ? m.lugar_pt : m.lugar_en]);
  }

  /* câmera */
  function margemGaveta() {
    if (window.innerWidth >= 820) return 0;
    var p = document.getElementById('painel');
    return p.classList.contains('aberto') ? 0 : p.offsetHeight;
  }
  function folga(extra) { var m = margemGaveta(); return { top: extra, left: extra, right: extra, bottom: extra + m }; }
  function inclinacao() { return TRES_D && estado.sel ? INCLINACAO : 0; }
  function voarPara(centro, zoom) { mapa.flyTo({ center: [centro[1], centro[0]], zoom: zoom - DZ - (inclinacao() ? 0.25 : 0), pitch: inclinacao(), padding: folga(0), duration: 900 }); }
  function zoomInicial() { return pequeno() ? 0.95 : 2; } // o globo inteiro ocupa a área do mapa
  function voarInicio() { mapa.flyTo({ center: [15, 22], zoom: zoomInicial(), pitch: 0, padding: folga(0), duration: 900 }); }
  function caixa(features) {
    var c = [180, 90, -180, -90];
    var anda = function (co) {
      if (typeof co[0] === 'number') { c[0] = Math.min(c[0], co[0]); c[1] = Math.min(c[1], co[1]); c[2] = Math.max(c[2], co[0]); c[3] = Math.max(c[3], co[1]); }
      else co.forEach(anda);
    };
    features.forEach(function (f) { anda(f.geometry.coordinates); });
    return c[0] > c[2] ? null : [[c[0], c[1]], [c[2], c[3]]];
  }
  function amplia(b, fr) {
    var dx = (b[1][0] - b[0][0]) * fr, dy = (b[1][1] - b[0][1]) * fr;
    return [[b[0][0] - dx, Math.max(-85, b[0][1] - dy)], [b[1][0] + dx, Math.min(85, b[1][1] + dy)]];
  }
  function voarParaArea(b, zmax) {
    if (!b) return;
    mapa.setPadding({ top: 0, bottom: 0, left: 0, right: 0 }); // a folga do fitBounds soma com a do mapa: zera antes
    var cam = mapa.cameraForBounds(b, { padding: folga(24), maxZoom: zmax - DZ, pitch: 0, bearing: 0 });
    if (!cam) return;
    var inc = inclinacao(); // inclinado, a área ocupa mais altura na tela: afasta um pouco
    mapa.flyTo({ center: cam.center, zoom: cam.zoom - (inc ? 0.35 : 0), pitch: inc, bearing: 0, duration: 900 });
  }
  function enquadrar(tipo, id) {
    if (!MAPA_PRONTO) return;
    if (tipo === 'r') {
      if (VISTAS[id]) voarPara(VISTAS[id][0], VISTAS[id][1] - (pequeno() ? 0.5 : 0));
      else voarParaArea(caixa(G.macros.features.filter(function (f) { return f.properties.r === id; })), 5);
    } else if (tipo === 't' || tipo === 'n') {
      var pts = (paisesDoGrupo({ tipo: tipo, id: id }) || []).map(function (k) { var p = D.paises[k]; return p && p.lx !== undefined ? ponto([p.ly, p.lx], {}) : null; }).filter(Boolean);
      if (pts.length) voarParaArea(amplia(caixa(pts), 0.35), 4);
    } else if (tipo === 'e') {
      voarParaArea(amplia(caixa(G.estados.features.filter(function (f) { return f.properties.id === id; })), 0.2), 6);
    } else if (tipo === 'a') {
      voarParaArea(amplia(caixa(featuresDaArea(id)), 0.15), 6);
    } else if (tipo === 'p') {
      if (VISTAS_PAIS[id]) { voarPara(VISTAS_PAIS[id][0], VISTAS_PAIS[id][1]); return; }
      var b = caixa(G.paises.features.filter(function (f) { return f.properties.k === id; }));
      if (b && b[1][0] - b[0][0] < 180) voarParaArea(b, 6);
    }
  }

  /* dica ao passar o mouse e cliques: área > estado > país */
  var dica = null;
  function mostrarDica(pt, conteudo) {
    if (!dica) { dica = el('div', { class: 'dica-mapa', role: 'presentation' }); document.getElementById('mapa').appendChild(dica); }
    dica.textContent = '';
    if (typeof conteudo === 'string') dica.textContent = conteudo; else dica.appendChild(conteudo);
    dica.style.display = 'block';
    dica.style.left = pt.x + 'px'; dica.style.top = (pt.y - 14) + 'px';
  }
  function esconderDica() { if (dica) dica.style.display = 'none'; }
  function alvo(pt) {
    var fs = mapa.queryRenderedFeatures(pt, { layers: ['guerra', 'disputa', 'estados', 'paises'] });
    var ordem = { guerra: 0, disputa: 1, estados: 2, paises: 3 };
    fs.sort(function (a, b) { return ordem[a.layer.id] - ordem[b.layer.id]; });
    for (var i = 0; i < fs.length; i++) {
      var f = fs[i];
      if ((f.layer.id === 'guerra' || f.layer.id === 'disputa') && D.areaPorId[f.properties.a]) return { tipo: 'a', f: f };
      if (f.layer.id === 'estados' && f.properties.id) return { tipo: 'e', f: f };
      if (f.layer.id === 'paises' && f.properties.r) return { tipo: 'p', f: f };
    }
    return null;
  }
  function marcarHover(x) {
    var pais = x && x.tipo === 'p' && estado.modo === 'paises' ? x.f.properties.k : '';
    var area = x && x.tipo === 'a' ? x.f.properties.a : '';
    var est = x && x.tipo === 'e' ? x.f.properties.id : '';
    if (pais !== hover.pais) { hover.pais = pais; mapa.setFilter('hover-pais', ['==', ['get', 'k'], pais]); }
    if (area !== hover.area) { hover.area = area; mapa.setFilter('hover-area-d', ['==', ['get', 'a'], area]); mapa.setFilter('hover-area-g', ['==', ['get', 'a'], area]); }
    if (est !== hover.estado) { hover.estado = est; mapa.setFilter('hover-estado', ['==', ['get', 'id'], est]); }
  }
  function textoDica(x) {
    if (x.tipo === 'a') {
      var a = D.areaPorId[x.f.properties.a];
      return el('div', {}, [el('strong', { text: nomeArea(a) }), el('br'), campoArea(a, 'quem') || '', el('br'), el('span', { class: 'dica', text: t('dicaArea') })]);
    }
    if (x.tipo === 'e') return x.f.properties.nome + ' · ' + t('noticiasLocais')(itensDoEstado(x.f.properties.id).length);
    return rotuloHover(x.f);
  }

  function montarMapa() {
    D.itens.length; // (os dados já foram lidos)
    G.paises.features.forEach(function (f) { if (f.properties.k) regiaoDoPais[f.properties.k] = f.properties.r || null; });
    mapa = new maplibregl.Map({
      container: 'mapa', style: estiloDoMapa(), center: [15, 22], zoom: zoomInicial(),
      minZoom: 0, maxZoom: 7, attributionControl: false, dragRotate: false, pitchWithRotate: false, maxPitch: 60,
      renderWorldCopies: true, fadeDuration: 150
    });
    mapa.touchZoomRotate.disableRotation();
    mapa.setPadding(folga(0)); // no celular, o globo fica no espaço acima da gaveta do painel
    mapa.keyboard.disableRotation();
    mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    mapa.on('styleimagemissing', function () { criarHachura(); });
    mapa.on('load', function () {
      MAPA_PRONTO = true;
      criarHachura();
      aplicarModo3D();
      if (NOITE) { atualizarNoite(); sincronizarRelogio().then(atualizarNoite); setInterval(atualizarNoite, 60000); }
      ultimaChaveRotulos = '';
      restyle();
      if (estado.sel) enquadrar(estado.sel.tipo, estado.sel.id);
      carregarMonumentos();
    });
    mapa.on('move', agendarMonumentos); // zoom e arrasto: entram os monumentos que chegam à vista
    mapa.on('mousemove', function (e) {
      var mon = monumentoEm(e.point);
      if (mon) { mapa.getCanvas().style.cursor = 'pointer'; marcarHover(null); mostrarDica(e.point, textoMonumento(mon)); return; }
      var x = alvo(e.point);
      mapa.getCanvas().style.cursor = x ? 'pointer' : '';
      marcarHover(x);
      var txt = x ? textoDica(x) : null;
      if (txt) mostrarDica(e.point, txt); else esconderDica();
    });
    mapa.on('mouseout', function () { esconderDica(); marcarHover(null); });
    mapa.on('movestart', esconderDica);
    mapa.on('click', function (e) {
      esconderDica();
      var mon = monumentoEm(e.point); // monumento: abre o estado (ou o país) onde ele fica
      if (mon) { selecionar(mon.estado && D.estadoPorId[mon.estado] ? { tipo: 'e', id: mon.estado } : { tipo: 'p', id: mon.pais }, false); return; }
      var x = alvo(e.point); if (!x) return;
      if (x.tipo === 'a') selecionar({ tipo: 'a', id: x.f.properties.a }, mapa.getZoom() + DZ < 4);
      else if (x.tipo === 'e') selecionar({ tipo: 'e', id: x.f.properties.id }, false);
      else if (estado.modo === 'regioes') selecionar({ tipo: 'r', id: x.f.properties.r }, true);
      else selecionar({ tipo: 'p', id: x.f.properties.k }, false);
    });
    mapa.on('zoomend', function () {
      var m = mapa.getZoom() + DZ >= LIMIAR_PAISES ? 'paises' : 'regioes';
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
    if (link && it.lc !== estado.l) { // notícia já no idioma da página dispensa o atalho de tradução
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
      // Mundo = nível 1: notícias que envolvem mais de um país (dados antigos sem nível: as mais geopolíticas)
      var n1 = todos.filter(function (i) { return i.nivel === 1 || (i.nivel === undefined && (i.pontos || 0) >= 3); });
      add(el('div', { class: 'secao', text: t('destaquesMundo') }));
      add(el('p', { class: 'dica-secao', text: t('nivelMundoDica') }));
      lista(variar(n1.length ? n1 : todos, 12, 2)).forEach(add);
    } else if (s.tipo === 'r') {
      var r = D.macroPorId[s.id], it = itensDe(r.paises);
      add(el('button', { type: 'button', class: 'voltar', text: t('voltar')(t('mundo')), on: { click: function () { selecionar(null, false); voarInicio(); } } }));
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
      if (dele.length) { // aviso de disputa, como o de guerra: qual área e quem disputa
        add(el('div', { class: 'aviso disputa' }, [el('div', { class: 'titulo-aviso', text: t('disputasDoPais') })].concat(dele.map(function (a) {
          return el('p', {}, [el('a', { href: '#a=' + a.id, text: nomeArea(a), on: { click: function (e) { e.preventDefault(); selecionar({ tipo: 'a', id: a.id }, true); } } }),
            ' · ' + campoArea(a, 'quem')]);
        }))));
      }
      if (p.ver !== undefined) {
        add(el('p', { class: 'aviso' }, p.ver ? [t('ver'), el('a', { href: '#p=' + p.ver, text: nomePais(p.ver), on: { click: function (e) { e.preventDefault(); selecionar({ tipo: 'p', id: p.ver }, true); } } }), '.'] : [t('semFonte')]));
      } else if (!coletado(s.id)) {
        add(el('p', { class: 'aviso', text: t('semColeta') }));
      } else {
        add(el('p', { class: 'resumo', text: resumo(itp) }));
        if (estado.cor === 'tom' && D.tom[s.id] !== undefined) add(el('p', { class: 'dica-secao', text: t('tomPainel')(fmtTom(D.tom[s.id])) }));
        if (D.estados[s.id]) { // piloto: estados com as notícias locais
          var ests = D.estados[s.id].map(function (e) { return { e: e, n: itensDoEstado(e.id).length }; })
            .sort(function (a, b) { return (b.n - a.n) || a.e.nome.localeCompare(b.e.nome); });
          add(el('div', { class: 'secao', text: t('estadosLocais') }));
          add(el('div', { class: 'lista-paises estados' }, ests.map(function (x) {
            return el('button', { type: 'button', class: x.n ? '' : 'sem', title: x.e.nome, on: { click: function () { selecionar({ tipo: 'e', id: x.e.id }, true); } } },
              [x.e.uf, x.n ? el('span', { class: 'n', text: num(x.n) }) : null]);
          })));
        }
        var p1 = itp.filter(function (i) { return i.nivel === 1; }), p2 = itp.filter(function (i) { return i.nivel !== 1; });
        if (p1.length) { add(el('div', { class: 'secao', text: t('nivel1') })); lista(variar(p1, 10, 10)).forEach(add); }
        if (p2.length || !p1.length) { add(el('div', { class: 'secao', text: t('nivel2') })); lista(variar(p2, 12, 12)).forEach(add); }
      }
    } else if (s.tipo === 'e') {
      var es = D.estadoPorId[s.id], ite = itensDoEstado(s.id);
      add(el('button', { type: 'button', class: 'voltar', text: t('voltar')(nomePais(es.pais)), on: { click: function () { selecionar({ tipo: 'p', id: es.pais }, true); } } }));
      add(el('div', { class: 'tipo', text: t('estado') + ' · ' + nomePais(es.pais) }));
      add(el('h2', { text: es.nome }));
      add(el('p', { class: 'resumo', text: t('noticiasLocais')(ite.length) + ' · ' + t('periodo')(estado.h) }));
      add(el('p', { class: 'dica-secao', text: t('dicaEstado') }));
      if (ite.length) lista(variar(ite, 15, 15)).forEach(add);
      else add(el('p', { class: 'vazio', text: t('semLocais')(estado.h) }));
    } else if (s.tipo === 'a') {
      var ar = D.areaPorId[s.id], ita = itensDaArea(s.id);
      add(el('button', { type: 'button', class: 'voltar', text: t('voltar')(t('mundo')), on: { click: function () { selecionar(null, false); } } }));
      add(el('div', { class: 'tipo', text: ar.tipo === 'guerra' ? t('areaGuerra') : t('areaDisputa') }));
      add(el('h2', { text: nomeArea(ar) }));
      add(el('dl', { class: 'ficha-area ' + ar.tipo }, [
        el('dt', { text: ar.tipo === 'guerra' ? t('emGuerra') : t('quemDisputa') }), el('dd', { class: 'lados', text: campoArea(ar, 'quem') }),
        el('dt', { text: t('quemControla') }), el('dd', { text: campoArea(ar, 'controle') }),
        el('dt', { text: t('porque') }), el('dd', { text: campoArea(ar, 'motivo') })
      ]));
      if (ar.deepstate && G.guerraMeta && G.guerraMeta.ocupado_km2) add(dadosGuerra(G.guerraMeta));
      if (campoArea(ar, 'nota')) add(el('p', { class: 'nota-area', text: campoArea(ar, 'nota') }));
      add(el('div', { class: 'secao', text: t('paisesEnvolvidos') }));
      add(el('div', { class: 'lista-paises' }, (ar.paises || []).filter(function (i) { return D.paises[i]; }).map(botaoPais)));
      add(el('div', { class: 'secao', text: t('noticiasArea') }));
      if (ita.length) { add(el('p', { class: 'resumo', text: resumo(ita) })); lista(variar(ita, 15, 5)).forEach(add); }
      else add(el('p', { class: 'vazio', text: t('semNoticiasArea')(estado.h) }));
    } else if (s.tipo === 't') {
      var tm = D.temaPorId[s.id];
      var itt = D.itens.filter(function (i) { return i.nivel !== 3 && (i.temas || []).indexOf(s.id) >= 0 && noPeriodo(i); })
        .sort(function (a, b) { return b.visto_em < a.visto_em ? -1 : 1; });
      add(el('button', { type: 'button', class: 'voltar', text: t('voltar')(t('mundo')), on: { click: function () { selecionar(null, false); } } }));
      add(el('div', { class: 'tipo', text: t('tema') }));
      add(el('h2', { text: nomeTema(tm) }));
      var ctx = estado.l === 'pt' ? tm.contexto_pt : (tm.contexto_en || tm.contexto_pt);
      if (ctx) add(el('p', { class: 'contexto', text: ctx }));
      add(el('div', { class: 'lista-paises' }, (tm.paises || []).filter(function (i) { return D.paises[i]; }).map(botaoPais)));
      add(el('p', { class: 'resumo', text: resumo(itt) }));
      lista(variar(itt, 15, 4)).forEach(add);
    } else if (s.tipo === 'n') {
      var hi = historiaPorId(s.id), top = historiasFoco(), pos = top.indexOf(hi);
      add(el('button', { type: 'button', class: 'voltar', text: t('voltar')(t('mundo')), on: { click: function () { selecionar(null, false); } } }));
      add(el('div', { class: 'tipo', text: t('focoTipo') + (pos >= 0 ? ' · ' + t('posFoco')(pos + 1, top.length) : '') }));
      if (!hi) { add(el('p', { class: 'vazio', text: t('focoSumiu') })); }
      else {
        add(el('h2', { text: tituloExib(hi.manchete) }));
        add(el('p', { class: 'resumo', text: t('repercussao')(hi.nVeiculos, hi.paisesFonte.length) + ' · ' + relativo(hi.recente) }));
        add(el('p', { class: 'dica-secao', text: t('focoDica') }));
        if (hi.envolvidos.length) {
          add(el('div', { class: 'secao', text: t('paisesEnvolvidos') }));
          add(el('div', { class: 'lista-paises' }, hi.envolvidos.filter(function (k) { return D.paises[k]; }).map(botaoPais)));
        }
        add(el('div', { class: 'secao', text: t('comoCadaPais') }));
        hi.paisesFonte.forEach(function (k) {
          add(el('button', { type: 'button', class: 'pais-fonte', text: nomePais(k), on: { click: function () { selecionar({ tipo: 'p', id: k }, true); } } }));
          lista(hi.itens.filter(function (i) { return i.pais === k; })).forEach(add);
        });
      }
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
  function mudarCor(m) { estado.cor = m; gravarRota(); renderLegenda(); renderPainel(); restyle(); }
  function renderLegenda() {
    var g = document.getElementById('legenda'); g.textContent = ''; g.removeAttribute('aria-hidden');
    var porTom = estado.cor === 'tom';
    var botao = function (m, txt) {
      return el('button', { type: 'button', 'aria-pressed': estado.cor === m ? 'true' : 'false', text: txt, on: { click: function () { mudarCor(m); } } });
    };
    g.appendChild(el('div', { class: 'cor-por-linha' }, [el('span', { text: t('corPor') }),
      el('div', { class: 'segmentado cor-por', role: 'group', 'aria-label': t('corPor') }, [botao('volume', t('corVolume')), botao('tom', t('corTom'))])]));
    g.appendChild(el('div', { text: t(porTom ? 'legTituloTom' : 'legTitulo') }));
    g.appendChild(el('div', { class: 'escala' }, (porTom ? P.tons : P.cores).map(function (c) { return el('span', { style: 'background:' + c }); })));
    g.appendChild(el('div', { style: 'display:flex;justify-content:space-between' }, [el('span', { text: t(porTom ? 'tomMenos' : 'menos') }), el('span', { text: t(porTom ? 'tomMais' : 'mais') })]));
    if (!porTom) g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + P.zero + ';border:1px solid ' + P.amostraBorda }), t('legSem')]));
    if (D.teste || !D.gerado) g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + P.semColeta }), t('legSemColeta')]));
    g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + P.legDisputa }), t('legDisputa')]));
    if (G.guerraMeta) {
      g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + P.legOcupado }), t('legOcupado')(dataCurta(G.guerraMeta.data))]));
      g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + P.legContestado }), t('legContestado')]));
    }
    if (D.areas.length) g.appendChild(el('div', { class: 'dica', text: t('legClique') }));
  }
  /* Em foco: esteira com as 5 notícias do mundo mais repercutidas. Passa sozinha e para com o mouse ou o foco;
     quem prefere menos movimento vê a lista parada, com rolagem. */
  var chaveFoco = '';
  function renderTemas() {
    var n = document.getElementById('temas'), top = historiasFoco();
    var chave = estado.l + '|' + top.map(function (h) { return h.id + ':' + h.nVeiculos; }).join(',');
    var marcar = function () {
      n.querySelectorAll('.manchete').forEach(function (b) { b.setAttribute('aria-pressed', estado.sel && estado.sel.tipo === 'n' && historiaPorId(estado.sel.id) && historiaPorId(estado.sel.id).id === b.dataset.id ? 'true' : 'false'); });
    };
    if (chave === chaveFoco) { marcar(); return; }
    chaveFoco = chave; n.textContent = '';
    n.setAttribute('aria-label', t('focoAria'));
    n.hidden = !top.length;
    n.appendChild(el('span', { class: 'rotulo', text: t('emFoco') }));
    var metade = function (copia) {
      return el('div', copia ? { class: 'metade', 'aria-hidden': 'true' } : { class: 'metade' }, top.map(function (h, i) {
        var b = el('button', { type: 'button', class: 'manchete', 'data-id': h.id, title: tituloExib(h.manchete),
          on: { click: function () { selecionar({ tipo: 'n', id: h.id }, true); } } },
          [el('span', { class: 'pos', text: String(i + 1) }), el('span', { class: 'txt', text: tituloExib(h.manchete) }),
           el('span', { class: 'meta', text: t('veiculosCurto')(h.nVeiculos) })]);
        if (copia) b.tabIndex = -1;
        return b;
      }));
    };
    var faixa = el('div', { class: 'faixa' }, [metade(false), metade(true)]);
    n.appendChild(el('div', { class: 'esteira' }, [faixa]));
    marcar();
    requestAnimationFrame(function () { faixa.style.setProperty('--duracao', Math.max(20, Math.round(faixa.scrollWidth / 2 / 45)) + 's'); });
  }
  /* Filtros: região, país (com os estados do piloto) e guerras e disputas. Mostram a seleção atual. */
  function regiaoDaSelecao() {
    var s = estado.sel; if (!s) return null;
    if (s.tipo === 'r') return s.id;
    var k = s.tipo === 'p' ? s.id : s.tipo === 'e' ? (D.estadoPorId[s.id] || {}).pais : null;
    return k && D.paises[k] ? D.paises[k].r || null : null;
  }
  function renderIrPara() {
    var sr = document.getElementById('filtro-regiao'), sp = document.getElementById('filtro-pais'), s = estado.sel;
    var porNome = function (a, b) { return nomePais(a).localeCompare(nomePais(b), estado.l); };
    sr.textContent = ''; sr.setAttribute('aria-label', t('filtroRegiao')); sr.parentNode.title = t('filtroRegiao');
    sr.appendChild(el('option', { value: '', text: t('escolhaRegiao') }));
    D.macros.slice().sort(function (a, b) { return nomeRegiao(a.id).localeCompare(nomeRegiao(b.id), estado.l); })
      .forEach(function (r) { sr.appendChild(el('option', { value: 'r:' + r.id, text: nomeRegiao(r.id) })); });
    var sa = document.getElementById('filtro-area');
    sa.textContent = ''; sa.setAttribute('aria-label', t('filtroArea')); sa.parentNode.title = t('filtroArea');
    sa.parentNode.hidden = !D.areas.length;
    sa.appendChild(el('option', { value: '', text: t('escolhaArea') }));
    [['guerra', t('grupoGuerras')], ['disputa', t('grupoDisputas')]].forEach(function (g) {
      var as = D.areas.filter(function (a) { return (a.tipo === 'guerra') === (g[0] === 'guerra'); })
        .sort(function (a, b) { return nomeArea(a).localeCompare(nomeArea(b), estado.l); });
      if (!as.length) return;
      var og = el('optgroup', { label: g[1] });
      as.forEach(function (a) { og.appendChild(el('option', { value: 'a:' + a.id, text: nomeArea(a) })); });
      sa.appendChild(og);
    });
    sp.textContent = ''; sp.setAttribute('aria-label', t('filtroPais')); sp.parentNode.title = t('filtroPais');
    sp.appendChild(el('option', { value: '', text: t('escolhaPais') }));
    var reg = regiaoDaSelecao(); // só os países, em ordem alfabética (sem agrupar por região)
    Object.keys(D.paises).filter(function (k) { return D.paises[k].r; }).sort(porNome)
      .forEach(function (k) { sp.appendChild(el('option', { value: 'p:' + k, text: nomePais(k) })); });
    Object.keys(D.estados).forEach(function (k) {
      var g4 = el('optgroup', { label: t('estadosIrPara')(nomePais(k)) });
      D.estados[k].slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, estado.l); })
        .forEach(function (e) { g4.appendChild(el('option', { value: 'e:' + e.id, text: e.nome })); });
      sp.appendChild(g4);
    });
    sr.value = reg ? 'r:' + reg : '';
    sa.value = s && s.tipo === 'a' ? 'a:' + s.id : '';
    sp.value = s && (s.tipo === 'p' || s.tipo === 'e') ? s.tipo + ':' + s.id : '';
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
    atualizarCoresMapa();
    renderLegenda(); restyle();
  }
  function renderTudo() {
    traduzirInterface(); atualizarBotoes(); renderTemas(); renderIrPara(); renderLegenda(); renderPainel(); renderRodape(); restyle();
  }

  function selecionar(sel, mover) {
    estado.sel = sel;
    gravarRota();
    if (sel && sel.tipo !== 'r' && estado.modo !== 'paises') { estado.modo = 'paises'; atualizarModo(); }
    renderTemas(); renderIrPara(); renderPainel(); restyle();
    if (sel && mover) enquadrar(sel.tipo, sel.id);
    if (sel) document.getElementById('painel').classList.add('aberto');
  }

  function ligarControles() {
    document.getElementById('idioma').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; estado.l = b.dataset.l; gravarRota(); renderTudo();
    });
    document.getElementById('periodo').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; estado.h = +b.dataset.h; gravarRota(); atualizarBotoes(); renderTemas(); renderPainel(); restyle();
    });
    document.getElementById('modo').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; estado.modo = b.dataset.m; atualizarModo(); restyle();
    });
    ['filtro-regiao', 'filtro-pais', 'filtro-area'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function (e) {
        var v = e.target.value; if (!v) { renderIrPara(); return; }
        selecionar({ tipo: v.slice(0, 1), id: v.slice(2) }, true);
      });
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
    carregar('data/areas.json').catch(function () { return []; }),
    carregar('data/estados.json').catch(function () { return {}; }),
    carregar('geo/estados/BR.geojson').catch(function () { return null; })
  ]).then(function (r) {
    Object.keys(r[9] || {}).forEach(function (k) {
      if (k.charAt(0) === '_') return;
      D.estados[k] = r[9][k];
      r[9][k].forEach(function (e) { e.pais = k; D.estadoPorId[e.id] = e; });
    });
    if (r[10] && r[10].features) G.estados = tresMundos(r[10]);
    D.areas = r[8] || [];
    D.areas.forEach(function (a) { D.areaPorId[a.id] = a; });
    D.paises = r[0]; D.macros = r[1]; D.temas = r[2] || [];
    D.macros.forEach(function (m) { D.macroPorId[m.id] = m; });
    D.temas.forEach(function (tm) { D.temaPorId[tm.id] = tm; });
    var n = r[3] || {};
    D.itens = n.itens || []; D.volume = n.volume || {}; D.coletados = n.paises_coletados || null;
    D.tom = n.tom_medio || {};
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
