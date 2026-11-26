/* Raccoon Mundi · Mapa geopolítico
 * Site estático: lê os arquivos de site/data e site/geo e monta o mapa com Leaflet.
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

  /* ---------- mapa ---------- */
  function estiloPais(f) {
    var k = f.properties.k, r = f.properties.r, grupo = paisesDoGrupo(estado.sel);
    if (!r) return { fillColor: P.semRegiao, fillOpacity: 1, color: P.bordaRegiao, weight: 0.4 };
    var fill = corDoValor(k, r);
    var s = estado.modo === 'regioes'
      ? { fillColor: fill, fillOpacity: 1, color: P.bordaRegiao, weight: 0.4, opacity: 0.9, lineJoin: 'round' }
      : { fillColor: fill, fillOpacity: 1, color: P.bordaPais, weight: 0.8, opacity: 0.85, lineJoin: 'round' };
    if (grupo && grupo.indexOf(k) < 0) s.fillOpacity = 0.35;
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
    atualizarEstados();
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
    } else if (s.tipo === 'e') {
      preench = contorno = G.estados.features.filter(function (f) { return f.properties.id === s.id; });
    } else {
      var alvo = s.tipo === 'p' ? [s.id] : (paisesDoGrupo(s) || []);
      preench = contorno = G.paises.features.filter(function (f) { return alvo.indexOf(f.properties.k) >= 0; });
    }
    if (!contorno.length) return;
    var fc = function (fs) { return { type: 'FeatureCollection', features: fs }; };
    var sombra = L.geoJSON(fc(contorno), { renderer: svg, smoothFactor: 0.4, interactive: false,
      style: { stroke: false, fillColor: P.sombra, fillOpacity: P.sombraOp } });
    var cima = L.geoJSON(fc(preench), { renderer: svg, smoothFactor: 0.4, interactive: false,
      style: function (f) {
        if (s.tipo === 'a') { var h = f.properties.tipo ? estiloGuerra(f) : estiloDisputa(); return { fillColor: h.fillColor, fillOpacity: 1, color: h.color, opacity: 1, weight: h.weight, dashArray: null }; }
        if (s.tipo === 'e') { var cp = estiloPais({ properties: { k: D.estadoPorId[s.id].pais, r: (D.paises[D.estadoPorId[s.id].pais] || {}).r } }); return { fillColor: cp.fillColor, fillOpacity: 1, stroke: false }; }
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
    if (camadaEstados && mapa.hasLayer(camadaEstados)) {
      if (s.tipo === 'p') { // o país está erguido: as linhas dos estados sobem junto
        camadaEstados.bringToFront();
        camadaEstados.eachLayer(function (l) { l._path.setAttribute('transform', 'translate(0 -2)'); });
      } else {
        camadaEstados.eachLayer(function (l) { l._path.removeAttribute('transform'); });
        sombra.bringToFront(); cima.bringToFront(); borda.bringToFront();
      }
    }
  }
  /* Estados (piloto: Brasil): aparecem só com o país ou um estado dele selecionado. */
  function estiloEstado() { return { fill: true, fillColor: '#000', fillOpacity: 0, color: P.bordaEstado, weight: 0.9, opacity: 1, lineJoin: 'round' }; }
  function atualizarEstados() {
    if (!camadaEstados) return;
    var k = paisDaSelecao();
    if (k && !mapa.hasLayer(camadaEstados)) camadaEstados.addTo(mapa);
    if (!k && mapa.hasLayer(camadaEstados)) mapa.removeLayer(camadaEstados);
    if (k) camadaEstados.setStyle(estiloEstado);
  }
  function ligarEstado(f, layer) {
    layer.on('mouseover', function () {
      var n = itensDoEstado(f.properties.id).length;
      layer.bindTooltip(f.properties.nome + ' · ' + t('noticiasLocais')(n), { sticky: true, className: 'rotulo-mapa', direction: 'top', offset: [0, -8] }).openTooltip();
      layer.setStyle({ weight: 2.2, color: P.destaque });
      layer.bringToFront();
    });
    layer.on('mouseout', function () { layer.unbindTooltip(); layer.setStyle(estiloEstado()); });
    layer.on('click', function (e) {
      L.DomEvent.stopPropagation(e); layer.unbindTooltip();
      selecionar({ tipo: 'e', id: f.properties.id }, false);
    });
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
      var dica = el('div', {}, [el('strong', { text: nomeArea(a) }), el('br'), campoArea(a, 'quem') || '', el('br'), el('span', { class: 'dica', text: t('dicaArea') })]);
      layer.bindTooltip(dica, { sticky: true, className: 'rotulo-mapa', direction: 'top', offset: [0, -8] }).openTooltip();
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
    return textoHover(k, r);
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
    } else if (tipo === 't' || tipo === 'n') { // tema ou notícia em foco: enquadra os países envolvidos pelos pontos dos nomes
      var pts = (paisesDoGrupo({ tipo: tipo, id: id }) || []).map(function (k) { var p = D.paises[k]; return p && p.lx !== undefined ? [p.ly, p.lx] : null; })
        .filter(Boolean);
      if (pts.length) voarParaArea(L.latLngBounds(pts).pad(0.35), 4);
    } else if (tipo === 'e') {
      var be = null;
      (G.estados ? G.estados.features : []).forEach(function (f) {
        if (f.properties.id === id && f.properties.copia === 0) { var bb = L.geoJSON(f).getBounds(); be = be ? be.extend(bb) : bb; }
      });
      if (be) voarParaArea(be.pad(0.2), 6);
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
      var pe = paisDaSelecao();
      if (pe) D.estados[pe].forEach(function (e) { // estados do país selecionado: sigla de longe, nome de perto
        cand.push({ ll: [e.ly, e.lx], linhas: z >= 5 ? quebrar(e.nome.toUpperCase(), 14) : [e.uf], cls: 'rotulo rotulo-estado', fs: pequeno ? 9 : 10, prio: 50 });
      });
      Object.keys(D.paises).forEach(function (k) {
        var p = D.paises[k];
        if (!p.r || p.lx === undefined || z < p.mz + (pequeno ? 1 : 0.3) || k === pe) return;
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
    if (G.estados) camadaEstados = L.geoJSON(G.estados, { renderer: svg, smoothFactor: 0.4, style: estiloEstado, onEachFeature: ligarEstado });
    criarHachura();
    mapa.createPane('rotulos').style.zIndex = 450;
    camadaRotulos = L.layerGroup().addTo(mapa);
    mapa.on('moveend', atualizarRotulos);
    mapa.on('movestart zoomstart', function () {
      [camadaPaises, camadaDisputa, camadaGuerra, camadaEstados].forEach(function (c) { if (c) c.eachLayer(function (l) { l.unbindTooltip(); }); });
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
