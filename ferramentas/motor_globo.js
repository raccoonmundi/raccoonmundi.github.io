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
    return { cor: c, op: grupo && grupo.indexOf(k) < 0 ? 0.35 : 1, fora: estado.cor === 'conflitos' && situacaoDe(k) === 'fora' ? 1 : 0 };
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
        // lente Conflitos: contorno vermelho em quem luta fora do próprio território
        { id: 'paises-fora', type: 'line', source: 'paises', layout: { 'line-join': 'round' },
          paint: { 'line-color': P.conf.foraLinha, 'line-width': 2.2, 'line-opacity': ['coalesce', ['feature-state', 'fora'], 0] } },
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
    p('paises-fora', 'line-color', P.conf.foraLinha);
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
    if (s.tipo === 't' || s.tipo === 'n' || s.tipo === 'g') return { paises: paisesDoGrupo(s) || [], estado: null };
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
    } else if (tipo === 't' || tipo === 'n' || tipo === 'g') {
      var pts = focoDoGrupo({ tipo: tipo, id: id }).map(function (k) { var p = D.paises[k]; return p && p.lx !== undefined ? ponto([p.ly, p.lx], {}) : null; }).filter(Boolean);
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

