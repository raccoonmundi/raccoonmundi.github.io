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
      noticias: function (n) { return n === 1 ? '1 story' : n + ' stories'; },
      dePaises: function (m) { return m === 1 ? 'from 1 country' : 'from ' + m + ' countries'; },
      periodo: function (h) { return 'last ' + h + ' h'; },
      voltar: function (nome) { return '← ' + nome; },
      paisesDaRegiao: 'Countries', regioesMaisAtivas: 'Most active regions', destaques: 'Latest stories',
      semNoticias: 'No stories from the local press in this period.',
      semColeta: 'This country is not collected yet in the test phase.',
      semFonte: 'GDELT has no source code for this territory.',
      ver: 'No separate collection for this territory. See ',
      abrir: 'Open story ↗', lerTraduzido: 'Read translated', estatal: 'State media', exilio: 'Media in exile', original: 'Original',
      atualizado: function (t) { return 'Updated ' + t + ' (Brasília time).'; },
      aindaNao: 'The first collection has not run yet.',
      teste: function (n) { return 'Test phase: ' + n + ' countries collected.'; },
      aviso: 'Automatic collection from local outlets (GDELT), not checked item by item. Headlines are machine-translated.',
      fronteiras: 'Borders: Natural Earth (de facto status); disputed areas are hatched.',
      creditos: 'Map: Raccoon Mundi, with data from ',
      legTitulo: 'Geopolitical stories, last 24 h', menos: 'fewer', mais: 'more',
      legSem: 'No stories', legSemColeta: 'Not collected yet', legDisputa: 'Disputed area',
      agora: 'just now', ha: function (n, u) { return n + ' ' + u + ' ago'; }, u: { m: 'min', h: 'h', d: 'd' },
      erro: 'Could not load the map data. Try reloading the page.', expandir: 'Expand panel'
    },
    pt: {
      mapa: 'MAPA', titulo: 'O mundo pela imprensa local', irPara: 'Ir para', escolha: 'Ir para…',
      regioes: 'Regiões', paises: 'Países', mundo: 'Mundo', regiao: 'Região', pais: 'País',
      tema: 'Em foco', emFoco: 'EM FOCO', ultimas: 'O mais recente da imprensa local',
      noticias: function (n) { return n === 1 ? '1 notícia' : n + ' notícias'; },
      dePaises: function (m) { return m === 1 ? 'de 1 país' : 'de ' + m + ' países'; },
      periodo: function (h) { return 'últimas ' + h + ' h'; },
      voltar: function (nome) { return '← ' + nome; },
      paisesDaRegiao: 'Países', regioesMaisAtivas: 'Regiões mais ativas', destaques: 'Notícias recentes',
      semNoticias: 'Nenhuma notícia da imprensa local neste período.',
      semColeta: 'Este país ainda não é coletado na fase de teste.',
      semFonte: 'O GDELT não tem código de fonte para este território.',
      ver: 'Território sem coleta própria. Veja ',
      abrir: 'Abrir matéria ↗', lerTraduzido: 'Ler traduzido', estatal: 'Mídia estatal', exilio: 'Mídia no exílio', original: 'Original',
      atualizado: function (t) { return 'Atualizado em ' + t + ' (horário de Brasília).'; },
      aindaNao: 'A primeira coleta ainda não rodou.',
      teste: function (n) { return 'Fase de teste: ' + n + ' países coletados.'; },
      aviso: 'Coleta automática da imprensa local (GDELT), sem checagem item a item. Títulos com tradução automática.',
      fronteiras: 'Fronteiras: Natural Earth (situação de fato); áreas disputadas hachuradas.',
      creditos: 'Mapa: Raccoon Mundi, com dados do ',
      legTitulo: 'Notícias geopolíticas, últimas 24 h', menos: 'menos', mais: 'mais',
      legSem: 'Sem notícias', legSemColeta: 'Ainda sem coleta', legDisputa: 'Área disputada',
      agora: 'agora', ha: function (n, u) { return 'há ' + n + ' ' + u; }, u: { m: 'min', h: 'h', d: 'd' },
      erro: 'Não foi possível carregar os dados do mapa. Tente recarregar a página.', expandir: 'Expandir painel'
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

  var CORES = ['#f6e3d6', '#eebfa2', '#e0916a', '#c9643a', '#a8400f'];
  var LIMITES_PAIS = [1, 2, 3, 4], LIMITES_REGIAO = [1, 2, 3, 4]; // recalculados pelos dados (quintis)
  var COR_ZERO = '#e9e3d7', COR_SEM_COLETA = '#dcd7ce', COR_SEM_REGIAO = '#e4dfd6';
  var VISTAS = { // regiões que cruzam a linha de data: enquadramento manual
    'russia': [[62, 95], 2.5], 'oceania': [[-22, 155], 3], 'america-do-norte': [[46, -100], 2.5]
  };
  var VISTAS_PAIS = { 'US': [[40, -98], 3], 'RU': [[62, 95], 2.5], 'NZ': [[-41, 173], 4.5], 'FJ': [[-17.8, 178], 6] };
  var LIMIAR_PAISES = 4;

  var estado = { l: 'en', h: 24, modo: 'regioes', sel: null };
  var D = { paises: {}, macros: [], macroPorId: {}, temas: [], temaPorId: {}, itens: [], porPais: {},
            volume: {}, coletados: null, gerado: null, teste: false };
  var mapa, svg, camadaPaises, camadaMacros, camadaDisputa, macroLayer = {}, modoAuto = 'regioes';

  function t(k) { return T[estado.l][k]; }
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
  function nomeTema(tm) { return estado.l === 'pt' ? (tm.nome_pt || tm.nome_en) : (tm.nome_en || tm.nome_pt); }

  /* ---------- dados ---------- */
  function referencia() { return D.gerado ? Date.parse(D.gerado) : Date.now(); }
  function noPeriodo(it) { return Date.parse(it.visto_em) >= referencia() - estado.h * 3600e3; }
  function itensDe(isos) {
    var out = [];
    isos.forEach(function (iso) { (D.porPais[iso] || []).forEach(function (it) { if (noPeriodo(it)) out.push(it); }); });
    return out.sort(function (a, b) { return b.visto_em < a.visto_em ? -1 : 1; });
  }
  function variar(itens, limite, maxPorPais) { // evita que um país domine a lista da região
    var cont = {}, out = [];
    for (var i = 0; i < itens.length && out.length < limite; i++) {
      var p = itens[i].pais; cont[p] = (cont[p] || 0) + 1;
      if (cont[p] <= maxPorPais) out.push(itens[i]);
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
    if (v === null || v === undefined) return COR_SEM_COLETA;
    if (v === 0) return COR_ZERO;
    for (var i = 0; i < limites.length; i++) if (v <= limites[i]) return CORES[i];
    return CORES[CORES.length - 1];
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
    if (q.get('t') && D.temaPorId[q.get('t')]) estado.sel = { tipo: 't', id: q.get('t') };
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
    if (!r) return { fillColor: COR_SEM_REGIAO, fillOpacity: 1, color: '#ffffff', weight: 0.4 };
    var fill = estado.modo === 'regioes' ? cor(volRegiao(r), LIMITES_REGIAO) : cor(coletado(k) ? (volPais(k) || 0) : null, LIMITES_PAIS);
    var s = { fillColor: fill, fillOpacity: 1, color: '#ffffff', weight: estado.modo === 'regioes' ? 0.3 : 0.7 };
    if (tema) {
      if ((tema.paises || []).indexOf(k) >= 0) { s.color = '#b23a0b'; s.weight = 2; }
      else s.fillOpacity = 0.35;
    }
    if (estado.sel && estado.sel.tipo === 'p' && estado.sel.id === k) { s.color = '#1f2a33'; s.weight = 2.2; }
    return s;
  }
  function estiloMacro(f) {
    var sel = estado.sel && estado.sel.tipo === 'r' && estado.sel.id === f.properties.r;
    return { fill: false, color: sel ? '#1f2a33' : '#ffffff', weight: sel ? 2.6 : (estado.modo === 'regioes' ? 1.6 : 1) };
  }
  function restyle() {
    camadaPaises.setStyle(estiloPais);
    camadaMacros.setStyle(estiloMacro);
    if (estado.sel && estado.sel.tipo === 'r' && macroLayer[estado.sel.id]) macroLayer[estado.sel.id].bringToFront();
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
  function enquadrar(tipo, id) {
    if (tipo === 'r') {
      if (VISTAS[id]) mapa.flyTo(VISTAS[id][0], VISTAS[id][1], { duration: 0.6 });
      else if (macroLayer[id]) mapa.flyToBounds(macroLayer[id].getBounds(), { padding: [20, 20], maxZoom: 5, duration: 0.6 });
    } else if (tipo === 't') {
      mapa.flyTo([28, 15], window.innerWidth < 820 ? 1 : 2, { duration: 0.6 });
    } else if (tipo === 'p') {
      if (VISTAS_PAIS[id]) { mapa.flyTo(VISTAS_PAIS[id][0], VISTAS_PAIS[id][1], { duration: 0.6 }); return; }
      var b = null;
      camadaPaises.eachLayer(function (l) { if (l.feature.properties.k === id) b = b ? b.extend(l.getBounds()) : L.latLngBounds(l.getBounds().getSouthWest(), l.getBounds().getNorthEast()); });
      if (b && b.getEast() - b.getWest() < 180) mapa.flyToBounds(b, { padding: [30, 30], maxZoom: 6, duration: 0.6 });
    }
  }
  function criarHachura() {
    var c = svg._container; if (!c || c.querySelector('#hachura')) return;
    var ns = 'http://www.w3.org/2000/svg', defs = document.createElementNS(ns, 'defs'), p = document.createElementNS(ns, 'pattern');
    p.setAttribute('id', 'hachura'); p.setAttribute('patternUnits', 'userSpaceOnUse'); p.setAttribute('width', '6'); p.setAttribute('height', '6');
    p.setAttribute('patternTransform', 'rotate(45)');
    var r = document.createElementNS(ns, 'rect'); r.setAttribute('width', '6'); r.setAttribute('height', '6'); r.setAttribute('fill', 'rgba(255,255,255,0.15)');
    var ln = document.createElementNS(ns, 'line'); ln.setAttribute('x1', '0'); ln.setAttribute('y1', '0'); ln.setAttribute('x2', '0'); ln.setAttribute('y2', '6');
    ln.setAttribute('stroke', '#4a5660'); ln.setAttribute('stroke-width', '1.4'); ln.setAttribute('stroke-opacity', '0.55');
    p.appendChild(r); p.appendChild(ln); defs.appendChild(p); c.insertBefore(defs, c.firstChild);
  }
  function montarMapa(geoPaises, geoMacros, geoDisputa) {
    var pequeno = window.innerWidth < 820;
    mapa = L.map('mapa', { zoomSnap: 0.5, minZoom: pequeno ? 1 : 1.5, maxZoom: 7, worldCopyJump: false,
      maxBounds: [[-75, -200], [88, 200]], maxBoundsViscosity: 0.8, attributionControl: false });
    svg = L.svg({ padding: 0.5 });
    mapa.setView([28, 15], pequeno ? 1 : 2);
    camadaPaises = L.geoJSON(geoPaises, { renderer: svg, style: estiloPais, onEachFeature: function (f, layer) {
      if (!f.properties.r) return;
      layer.on('mouseover', function () {
        var txt = rotuloHover(f); if (!txt) return;
        layer.bindTooltip(txt, { sticky: true, className: 'rotulo-mapa', direction: 'top', offset: [0, -8] }).openTooltip();
        if (estado.modo === 'paises') layer.setStyle({ weight: 2, color: '#1f2a33' });
      });
      layer.on('mouseout', function () { layer.closeTooltip(); camadaPaises.resetStyle(layer); });
      layer.on('click', function () {
        if (estado.modo === 'regioes') selecionar({ tipo: 'r', id: f.properties.r }, true);
        else selecionar({ tipo: 'p', id: f.properties.k }, false);
      });
    } }).addTo(mapa);
    camadaMacros = L.geoJSON(geoMacros, { renderer: svg, interactive: false, style: estiloMacro,
      onEachFeature: function (f, layer) { macroLayer[f.properties.r] = layer; } }).addTo(mapa);
    camadaDisputa = L.geoJSON(geoDisputa, { renderer: svg, interactive: false,
      style: { fillColor: 'url(#hachura)', fillOpacity: 1, color: '#4a5660', weight: 0.6, dashArray: '2 2' } }).addTo(mapa);
    criarHachura();
    mapa.on('zoomend', function () {
      var m = mapa.getZoom() >= LIMIAR_PAISES ? 'paises' : 'regioes';
      if (m !== modoAuto) { modoAuto = m; if (estado.modo !== m) { estado.modo = m; atualizarModo(); restyle(); } }
    });
  }

  /* ---------- painel ---------- */
  function cartao(it) {
    var exib = estado.l === 'pt' ? (it.titulo_pt || it.titulo_en || it.titulo_original) : (it.titulo_en || it.titulo_original);
    var link = urlSegura(it.url) ? it.url : null;
    var titulo = el('p', { class: 'titulo' }, [link ? el('a', { href: link, target: '_blank', rel: 'noopener', text: exib }) : exib]);
    var filhos = [titulo];
    if (exib !== it.titulo_original) filhos.push(el('p', { class: 'original', text: t('original') + ': ' + it.titulo_original }));
    var idioma = estado.l === 'pt' ? (IDIOMAS_PT[it.idioma] || it.idioma) : it.idioma;
    var meta = el('div', { class: 'meta' }, [
      el('span', { text: it.veiculo }),
      idioma ? el('span', { text: '· ' + idioma }) : null,
      el('span', { title: fmtData[estado.l].format(new Date(it.visto_em)), text: '· ' + relativo(it.visto_em) }),
      it.midia_estatal ? el('span', { class: 'selo', text: t('estatal') }) : null,
      it.midia_exilio ? el('span', { class: 'selo exilio', text: t('exilio') }) : null
    ]);
    if (link) {
      meta.appendChild(el('a', { href: link, target: '_blank', rel: 'noopener', text: t('abrir') }));
      meta.appendChild(el('a', { href: 'https://translate.google.com/translate?sl=auto&tl=' + estado.l + '&u=' + encodeURIComponent(link),
        target: '_blank', rel: 'noopener', text: t('lerTraduzido') }));
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
      [nomePais(iso), col ? el('span', { class: 'n', text: String(n) }) : null]);
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
            [nomeRegiao(x.r.id), el('span', { class: 'n', text: String(x.v) })]);
        })));
      }
      add(el('div', { class: 'secao', text: t('destaques') }));
      lista(variar(todos, 12, 2)).forEach(add);
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
      if (p.ver !== undefined) {
        add(el('p', { class: 'aviso' }, p.ver ? [t('ver'), el('a', { href: '#p=' + p.ver, text: nomePais(p.ver), on: { click: function (e) { e.preventDefault(); selecionar({ tipo: 'p', id: p.ver }, true); } } }), '.'] : [t('semFonte')]));
      } else if (!coletado(s.id)) {
        add(el('p', { class: 'aviso', text: t('semColeta') }));
      } else {
        add(el('p', { class: 'resumo', text: resumo(itp) }));
        lista(itp.slice(0, 10)).forEach(add);
      }
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
  }
  function renderRodape() {
    var r = document.getElementById('rodape'); r.textContent = '';
    if (D.gerado) r.appendChild(el('p', { text: t('atualizado')(fmtData[estado.l].format(new Date(D.gerado))) }));
    if (D.teste && D.coletados) r.appendChild(el('p', { text: t('teste')(D.coletados.length) }));
    r.appendChild(el('p', { text: t('aviso') }));
    r.appendChild(el('p', { text: t('fronteiras') }));
    r.appendChild(el('p', {}, [t('creditos'), el('a', { href: 'https://www.naturalearthdata.com', target: '_blank', rel: 'noopener', text: 'Natural Earth' }),
      estado.l === 'pt' ? ' e do ' : ' and ', el('a', { href: 'https://www.gdeltproject.org', target: '_blank', rel: 'noopener', text: 'GDELT' }), '.']));
  }
  function renderLegenda() {
    var g = document.getElementById('legenda'); g.textContent = '';
    g.appendChild(el('div', { text: t('legTitulo') }));
    g.appendChild(el('div', { class: 'escala' }, CORES.map(function (c) { return el('span', { style: 'background:' + c }); })));
    g.appendChild(el('div', { style: 'display:flex;justify-content:space-between' }, [el('span', { text: t('menos') }), el('span', { text: t('mais') })]));
    g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + COR_ZERO + ';border:1px solid #d6cfc2' }), t('legSem')]));
    if (D.teste || !D.gerado) g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:' + COR_SEM_COLETA }), t('legSemColeta')]));
    g.appendChild(el('div', { class: 'linha' }, [el('span', { class: 'amostra', style: 'background:repeating-linear-gradient(45deg,#e9e3d7 0 2px,#8a939b 2px 3px)' }), t('legDisputa')]));
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
    s.appendChild(g1); s.appendChild(g2);
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
  }
  function renderTudo() {
    traduzirInterface(); atualizarBotoes(); renderTemas(); renderIrPara(); renderLegenda(); renderPainel(); renderRodape(); restyle();
  }

  function selecionar(sel, mover) {
    estado.sel = sel;
    gravarRota();
    if (sel && (sel.tipo === 'p' || sel.tipo === 't') && estado.modo !== 'paises') { estado.modo = 'paises'; atualizarModo(); }
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
    window.addEventListener('hashchange', function () { lerRota(); renderTudo(); if (estado.sel) enquadrar(estado.sel.tipo, estado.sel.id); });
  }

  function carregar(u) {
    return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  }
  Promise.all([
    carregar('data/paises.json'), carregar('data/macrorregioes.json'), carregar('data/temas.json'),
    carregar('data/noticias.json').catch(function () { return {}; }),
    carregar('geo/paises.geojson'), carregar('geo/macrorregioes.geojson'), carregar('geo/disputadas.geojson')
  ]).then(function (r) {
    D.paises = r[0]; D.macros = r[1]; D.temas = r[2] || [];
    D.macros.forEach(function (m) { D.macroPorId[m.id] = m; });
    D.temas.forEach(function (tm) { D.temaPorId[tm.id] = tm; });
    var n = r[3] || {};
    D.itens = n.itens || []; D.volume = n.volume || {}; D.coletados = n.paises_coletados || null;
    D.gerado = n.gerado_em || null; D.teste = !!n.teste;
    D.itens.forEach(function (it) { (D.porPais[it.pais] = D.porPais[it.pais] || []).push(it); });
    Object.keys(D.porPais).forEach(function (k) { D.porPais[k].sort(function (a, b) { return b.visto_em < a.visto_em ? -1 : 1; }); });
    calcularEscalas();
    lerRota();
    montarMapa(r[4], r[5], r[6]);
    ligarControles();
    renderTudo();
    if (estado.sel) enquadrar(estado.sel.tipo, estado.sel.id);
  }).catch(function (e) {
    console.error(e);
    document.getElementById('painel-conteudo').appendChild(el('p', { class: 'aviso', text: T[estado.l].erro }));
  });
})();
