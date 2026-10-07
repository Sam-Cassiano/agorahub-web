/*
 * ÁgoraHub Web — Modo de edição (estilo Figma).
 *
 * - Selecionar: clique em qualquer elemento do app (contorno azul + medidas).
 * - Inspetor: texto, cor do texto, fundo, fonte, peso, raio, espaçamento, alinhamento, ocultar.
 * - Duplo clique em um texto: edita direto na tela.
 * - Tema: muda as cores do app inteiro (claro e escuro separados).
 * - Desfazer/Refazer (Ctrl+Z / Ctrl+Shift+Z), Esc solta a seleção, E liga/desliga.
 * - Salvar: automático no navegador + arquivo edicao.json. Com edicao.json na raiz do
 *   projeto, a versão publicada na Vercel já abre com a edição.
 * - Exportar para o Figma: SVG em camadas (tela atual ou todas as telas lado a lado),
 *   por download ou copiado para colar com Ctrl+V no Figma.
 *
 * Textos mudam em todo o app (como o strings.xml). Estilos valem para a tela em que foram feitos.
 */
(function () {
  const CHAVE = "agorahub-edicao-v1";
  const vazia = () => ({ versao: 1, tokens: { claro: {}, escuro: {} }, textos: {}, estilos: {} });
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let ed = vazia();
  let ligado = false;
  let selecionado = null;
  let historico = [], futuro = [];
  let aba = "inspetor";

  // ================================================================ Persistência
  function lerLocal() { try { const s = localStorage.getItem(CHAVE); return s ? JSON.parse(s) : null; } catch (_) { return null; } }
  function gravarLocal() { try { localStorage.setItem(CHAVE, JSON.stringify(ed)); } catch (_) {} }
  function normalizar(o) {
    const v = vazia();
    if (!o || typeof o !== "object") return v;
    v.tokens.claro = Object.assign({}, o.tokens && o.tokens.claro);
    v.tokens.escuro = Object.assign({}, o.tokens && o.tokens.escuro);
    v.textos = Object.assign({}, o.textos);
    v.estilos = Object.assign({}, o.estilos);
    return v;
  }
  async function carregarPublicada() {
    try {
      const r = await fetch("edicao.json", { cache: "no-store" });
      if (!r.ok) return null;
      return normalizar(await r.json());
    } catch (_) { return null; }
  }
  function marcarSalvo(txt) {
    const s = document.getElementById("ed-salvo");
    if (s) { s.textContent = txt || "Salvo neste navegador"; s.classList.add("pisca"); setTimeout(() => s.classList.remove("pisca"), 600); }
  }
  /** Registra uma mudança: guarda histórico, salva e reaplica. */
  function mudar(fn) {
    historico.push(JSON.stringify(ed)); if (historico.length > 100) historico.shift();
    futuro = [];
    fn();
    gravarLocal(); aplicarTudo(); marcarSalvo();
    atualizarPainel();
  }
  function desfazer() {
    if (!historico.length) return;
    futuro.push(JSON.stringify(ed)); ed = JSON.parse(historico.pop());
    gravarLocal(); reRender(); marcarSalvo("Desfeito");
  }
  function refazer() {
    if (!futuro.length) return;
    historico.push(JSON.stringify(ed)); ed = JSON.parse(futuro.pop());
    gravarLocal(); reRender(); marcarSalvo("Refeito");
  }
  function reRender() { aplicarTokens(); const caminho = selecionado ? caminhoDe(selecionado) : null; AH.render(); if (caminho) selecionar(elementoDe(caminho)); else atualizarPainel(); }

  // ================================================================ Tema (tokens)
  const TOKENS = [
    ["--primary", "Primária"], ["--on-primary", "Texto sobre a primária"],
    ["--primary-container", "Primária suave"], ["--on-primary-container", "Texto sobre primária suave"],
    ["--secondary", "Secundária (links)"], ["--tertiary", "Terciária (sucesso)"],
    ["--tertiary-container", "Terciária suave"], ["--error", "Erro"], ["--error-container", "Erro suave"],
    ["--warn-bg", "Aviso (fundo)"], ["--warn-fg", "Aviso (texto)"],
    ["--bg", "Fundo das telas"], ["--on-bg", "Texto"], ["--on-surface-variant", "Texto secundário"],
    ["--sc-lowest", "Cartões"], ["--sc", "Barra de navegação"], ["--sc-high", "Tags / diálogos"],
    ["--outline", "Contorno"], ["--outline-variant", "Contorno suave"], ["--page", "Fundo da página (fora do celular)"],
  ];
  const temaEscuro = () => {
    const t = document.documentElement.getAttribute("data-tema");
    return t === "escuro" || (!t && matchMedia("(prefers-color-scheme: dark)").matches);
  };
  const blocoVars = (o) => Object.entries(o).filter(([k]) => /^--[\w-]+$/.test(k)).map(([k, v]) => `${k}:${String(v).replace(/[;{}<]/g, "")};`).join("");
  function aplicarTokens() {
    let st = document.getElementById("ed-tokens");
    if (!st) { st = document.createElement("style"); st.id = "ed-tokens"; document.head.appendChild(st); }
    const c = blocoVars(ed.tokens.claro), e = blocoVars(ed.tokens.escuro);
    st.textContent = (c ? `:root{${c}}` : "") +
      (e ? `@media (prefers-color-scheme: dark){:root:not([data-tema="claro"]){${e}}}:root[data-tema="escuro"]{${e}}` : "");
  }

  // ================================================================ Caminhos (onde fica cada elemento)
  const rotaNome = () => (location.hash.replace(/^#\/?/, "").split(/[/?]/)[0] || "home");
  function caminhoDe(el) {
    const app = document.getElementById("app");
    const idx = [];
    while (el && el !== app) { idx.unshift([...el.parentElement.children].indexOf(el)); el = el.parentElement; }
    return el === app ? idx.join(">") : null;
  }
  function elementoDe(caminho) {
    let el = document.getElementById("app");
    if (caminho === "") return el;
    for (const i of caminho.split(">")) { el = el && el.children[Number(i)]; if (!el) return null; }
    return el;
  }

  // ================================================================ Textos
  const original = new WeakMap(); // nó de texto → texto original
  function aplicarTextos(raiz) {
    if (!Object.keys(ed.textos).length) return;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      const orig = original.has(n) ? original.get(n) : n.nodeValue.trim();
      if (!orig) continue;
      if (Object.prototype.hasOwnProperty.call(ed.textos, orig)) {
        original.set(n, orig);
        const m = n.nodeValue.match(/^(\s*)[\s\S]*?(\s*)$/);
        const novo = m[1] + ed.textos[orig] + m[2];
        if (n.nodeValue !== novo) n.nodeValue = novo;
      }
    }
  }
  const textosDiretos = (el) => [...el.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim());
  const textoOriginal = (n) => (original.has(n) ? original.get(n) : n.nodeValue.trim());

  // ================================================================ Estilos por tela
  const PROPS = ["color", "backgroundColor", "fontSize", "fontWeight", "borderRadius", "padding", "margin", "textAlign", "letterSpacing", "lineHeight", "display", "borderColor", "borderWidth", "borderStyle", "opacity", "width", "height"];
  function aplicarEstilos() {
    const pref = rotaNome() + "|";
    for (const [k, props] of Object.entries(ed.estilos)) {
      if (!k.startsWith(pref)) continue;
      const el = elementoDe(k.slice(pref.length));
      if (el) for (const [p, v] of Object.entries(props)) if (PROPS.includes(p)) el.style[p] = v;
    }
  }

  function aplicarTudo() {
    aplicarTokens();
    const app = document.getElementById("app");
    if (!app) return;
    aplicarTextos(app);
    aplicarEstilos();
    posicionar();
  }

  /** Chamado pelo app.js depois de cada troca de tela. */
  function aposRender(app) {
    aplicarTextos(app);
    aplicarEstilos();
    if (selecionado && !selecionado.isConnected) selecionado = null;
    posicionar(); atualizarPainel();
    // listas desenhadas depois (ex.: Pessoas) também recebem os textos
    if (!aposRender.obs) {
      aposRender.obs = new MutationObserver(() => { if (!aposRender.ocupado) { aposRender.ocupado = true; requestAnimationFrame(() => { aplicarTextos(app); aposRender.ocupado = false; }); } });
      aposRender.obs.observe(app, { childList: true, subtree: true });
    }
  }

  // ================================================================ Seleção (sobreposições)
  const ov = {};
  function criarOverlays() {
    for (const n of ["hover", "sel"]) {
      ov[n] = document.createElement("div"); ov[n].className = "ed-" + n; ov[n].hidden = true;
      ov[n].innerHTML = '<span class="ed-rot"></span>';
      document.body.appendChild(ov[n]);
    }
  }
  function nomeDe(el) {
    if (el.id === "app") return "Tela";
    const t = el.tagName.toLowerCase();
    const c = [...el.classList].filter((x) => !x.startsWith("ed-"))[0];
    const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24);
    return (c ? c : t) + (txt && el.children.length < 3 ? ` · ${txt}` : "");
  }
  function desenhar(o, el) {
    if (!el || !el.isConnected) { o.hidden = true; return; }
    const r = el.getBoundingClientRect();
    o.hidden = false;
    Object.assign(o.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
    o.querySelector(".ed-rot").textContent = `${nomeDe(el)}  ${Math.round(r.width)}×${Math.round(r.height)}`;
  }
  function posicionar() {
    if (!ov.sel) return;
    if (!ligado) { ov.sel.hidden = ov.hover.hidden = true; return; }
    desenhar(ov.sel, selecionado);
  }
  const dentroDoApp = (t) => t && t.closest && t.closest("#app") && !t.closest(".snack");
  function selecionar(el) {
    selecionado = el && el.isConnected ? el : null;
    aba = "inspetor";
    posicionar(); atualizarPainel();
  }

  function ligarEventos() {
    document.addEventListener("mousemove", (e) => {
      if (!ligado) return;
      const t = e.target;
      if (dentroDoApp(t) && t !== selecionado) desenhar(ov.hover, t); else ov.hover.hidden = true;
    }, true);
    const bloquear = (e) => {
      if (!ligado || !dentroDoApp(e.target)) return;
      if (e.target.isContentEditable) return;
      e.preventDefault(); e.stopPropagation();
      if (e.type === "click") selecionar(e.target);
    };
    ["click", "submit", "mousedown", "pointerdown", "focusin"].forEach((t) => document.addEventListener(t, (e) => {
      if (t === "mousedown" || t === "pointerdown" || t === "focusin") {
        if (ligado && dentroDoApp(e.target) && !e.target.isContentEditable) { e.preventDefault(); if (t === "focusin") e.target.blur(); }
        return;
      }
      bloquear(e);
    }, true));
    document.addEventListener("dblclick", (e) => {
      if (!ligado || !dentroDoApp(e.target)) return;
      e.preventDefault(); e.stopPropagation();
      editarNaTela(e.target);
    }, true);
    document.addEventListener("keydown", (e) => {
      const digitando = e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      const emCampo = digitando || (e.target.closest && e.target.closest(".ed-painel"));
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && ligado && !digitando) {
        e.preventDefault(); e.shiftKey ? refazer() : desfazer(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && ligado && !digitando) { e.preventDefault(); refazer(); return; }
      if (emCampo) return;
      if (e.key === "e" || e.key === "E") { alternar(); }
      else if (e.key === "Escape" && ligado) selecionar(null);
      else if (ligado && selecionado && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const alvo = e.key === "ArrowUp" ? selecionado.parentElement : selecionado.firstElementChild;
        if (alvo && (alvo.id === "app" || dentroDoApp(alvo))) selecionar(alvo);
      }
    });
    addEventListener("resize", posicionar);
    document.addEventListener("scroll", posicionar, true);
  }

  /** Edição direta do texto (duplo clique). */
  function editarNaTela(el) {
    const nos = textosDiretos(el);
    if (nos.length !== 1) { selecionar(el); const ta = document.getElementById("ed-texto"); if (ta) ta.focus(); return; }
    const no = nos[0];
    const orig = textoOriginal(no);
    if (el.children.length) { selecionar(el); const ta = document.getElementById("ed-texto"); if (ta) { ta.focus(); ta.select(); } return; }
    selecionar(el);
    el.contentEditable = "true"; el.classList.add("ed-editando"); el.focus();
    const sel = getSelection(); const r = document.createRange(); r.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(r);
    const terminar = (salvar) => {
      el.removeEventListener("blur", aoSair); el.removeEventListener("keydown", aoTecla);
      el.contentEditable = "false"; el.classList.remove("ed-editando");
      const novo = el.textContent.trim();
      for (const n of textosDiretos(el)) original.set(n, orig);
      if (salvar && novo && novo !== (ed.textos[orig] || orig)) mudar(() => { if (novo === orig) delete ed.textos[orig]; else ed.textos[orig] = novo; });
      else if (!salvar) aplicarTudo();
    };
    const aoSair = () => terminar(true);
    const aoTecla = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); el.blur(); } if (e.key === "Escape") { e.preventDefault(); el.textContent = ed.textos[orig] || orig; terminar(false); } };
    el.addEventListener("blur", aoSair); el.addEventListener("keydown", aoTecla);
  }

  // ================================================================ Painel
  const corHex = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return /^#[0-9a-f]{6}$/i.test(c) ? c : "#000000";
    const [r, g, b] = m[1].split(",").map((x) => parseFloat(x));
    return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
  };
  const transparente = (c) => /rgba\([^)]*,\s*0\)/.test(c) || c === "transparent";

  function chaveSel() { const c = caminhoDe(selecionado); return c == null ? null : rotaNome() + "|" + c; }
  function setEstilo(prop, valor) {
    const k = chaveSel(); if (!k) return;
    mudar(() => {
      const o = Object.assign({}, ed.estilos[k]);
      if (valor === null || valor === "") { delete o[prop]; selecionado.style[prop] = ""; } else o[prop] = valor;
      if (Object.keys(o).length) ed.estilos[k] = o; else delete ed.estilos[k];
    });
  }

  function htmlInspetor() {
    if (!selecionado) return `<div class="ed-vazio"><p><b>Clique em qualquer parte da tela</b> para selecionar.</p>
      <p>Duplo clique em um texto para editar direto.<br>↑ seleciona o elemento pai, ↓ o primeiro filho.<br>Esc solta a seleção.</p>
      <p class="ed-dica">Para navegar entre telas, desligue a edição (tecla E) e ligue de novo.</p></div>`;
    const el = selecionado, cs = getComputedStyle(el);
    const k = chaveSel(); const mudados = (k && ed.estilos[k]) || {};
    const nos = textosDiretos(el);
    const mk = (p) => (mudados[p] != null ? '<span class="ed-mud" title="Alterado">●</span>' : "");
    const cor = (p, rot) => `<label class="ed-l">${rot}${mk(p)}<span class="ed-cor"><input type="color" data-p="${p}" value="${corHex(cs[p])}">
      <code>${transparente(cs[p]) ? "transparente" : corHex(cs[p]).toUpperCase()}</code>${mudados[p] != null ? `<button class="ed-x" data-limpa="${p}" title="Voltar ao original">×</button>` : ""}</span></label>`;
    const num = (p, rot, unid = "px", passo = 1) => `<label class="ed-l">${rot}${mk(p)}<span class="ed-num"><input type="number" step="${passo}" data-p="${p}" data-u="${unid}" value="${parseFloat(cs[p]) || 0}"><i>${unid}</i>${mudados[p] != null ? `<button class="ed-x" data-limpa="${p}">×</button>` : ""}</span></label>`;
    return `<div class="ed-cab"><b>${esc(nomeDe(el))}</b><span>${Math.round(el.getBoundingClientRect().width)} × ${Math.round(el.getBoundingClientRect().height)}</span></div>
      ${nos.length === 1 ? `<label class="ed-l ed-col">Texto <span class="ed-dica">(muda em todo o app)</span><textarea id="ed-texto" rows="3">${esc(nos[0].nodeValue.trim())}</textarea>
        ${ed.textos[textoOriginal(nos[0])] != null ? `<button class="ed-btn-link" data-texto-orig>Voltar ao texto original</button>` : ""}</label>` : ""}
      <h4>Cores</h4>${cor("color", "Texto")}${cor("backgroundColor", "Fundo")}${cor("borderColor", "Borda")}
      <h4>Texto</h4>${num("fontSize", "Tamanho")}
      <label class="ed-l">Peso${mk("fontWeight")}<select data-p="fontWeight">${[300, 400, 500, 600, 700, 800].map((w) => `<option ${String(cs.fontWeight) === String(w) ? "selected" : ""}>${w}</option>`).join("")}</select></label>
      <label class="ed-l">Alinhar${mk("textAlign")}<select data-p="textAlign">${["left", "center", "right", "justify"].map((a) => `<option value="${a}" ${cs.textAlign === a || (a === "left" && cs.textAlign === "start") ? "selected" : ""}>${{ left: "Esquerda", center: "Centro", right: "Direita", justify: "Justificado" }[a]}</option>`).join("")}</select></label>
      ${num("letterSpacing", "Espaçamento letras", "px", 0.1)}
      <h4>Caixa</h4>${num("borderRadius", "Raio")}${num("padding", "Espaço interno")}${num("margin", "Margem")}${num("borderWidth", "Borda")}
      ${num("width", "Largura")}${num("height", "Altura")}
      <label class="ed-l">Opacidade${mk("opacity")}<span class="ed-num"><input type="range" min="0" max="1" step="0.05" data-p="opacity" data-u="" value="${cs.opacity}"></span></label>
      <div class="ed-acoes"><button class="ed-btn" data-ocultar>${mudados.display === "none" ? "Mostrar" : "Ocultar"}</button>
      <button class="ed-btn" data-limpar-el ${Object.keys(mudados).length ? "" : "disabled"}>Limpar estilos</button></div>
      <p class="ed-dica">Estilos valem para esta tela (${esc(rotaNome())}). Para mudar o app todo, use a aba Tema.</p>`;
  }

  function htmlTema() {
    const modo = temaEscuro() ? "escuro" : "claro";
    const raiz = getComputedStyle(document.documentElement);
    return `<p class="ed-dica">Editando o tema <b>${modo}</b>. Troque em Perfil › Aparência para editar o outro.</p>
      ${TOKENS.map(([v, rot]) => {
        const mud = ed.tokens[modo][v] != null;
        const val = raiz.getPropertyValue(v).trim();
        return `<label class="ed-l">${rot}${mud ? '<span class="ed-mud">●</span>' : ""}<span class="ed-cor"><input type="color" data-token="${v}" value="${corHex(val)}"><code>${corHex(val).toUpperCase()}</code>${mud ? `<button class="ed-x" data-limpa-token="${v}">×</button>` : ""}</span></label>`;
      }).join("")}
      <div class="ed-acoes"><button class="ed-btn" data-limpar-tema ${Object.keys(ed.tokens[modo]).length ? "" : "disabled"}>Voltar às cores originais</button></div>`;
  }

  function htmlArquivo() {
    const nT = Object.keys(ed.textos).length, nE = Object.keys(ed.estilos).length, nC = Object.keys(ed.tokens.claro).length + Object.keys(ed.tokens.escuro).length;
    return `<p class="ed-resumo">${nT} textos · ${nE} elementos · ${nC} cores alteradas</p>
      <h4>Salvar</h4>
      <p class="ed-dica">Tudo já fica salvo neste navegador. Para levar ao site publicado, baixe o <b>edicao.json</b>, coloque na pasta do projeto (ao lado do index.html) e faça <code>git push</code> — a Vercel publica com a edição.</p>
      <div class="ed-acoes ed-col"><button class="ed-btn ed-prim" data-baixar-json>Baixar edicao.json</button>
      <label class="ed-btn">Abrir edicao.json…<input type="file" accept="application/json,.json" data-abrir-json hidden></label>
      <button class="ed-btn" data-publicada>Carregar a versão publicada</button>
      <button class="ed-btn ed-perigo" data-zerar>Descartar todas as edições</button></div>
      <h4>Figma</h4>
      <p class="ed-dica">Gera SVG com camadas (fundos, textos em Roboto e ícones vetoriais). No Figma: <b>Ctrl+V</b> depois de copiar, ou arraste o arquivo .svg para a tela.</p>
      <div class="ed-acoes ed-col"><button class="ed-btn ed-prim" data-fig="copiar">Copiar tela para o Figma</button>
      <button class="ed-btn" data-fig="baixar">Baixar tela (.svg)</button>
      <button class="ed-btn" data-fig="todas">Baixar todas as telas (.svg)</button></div>`;
  }

  function atualizarPainel() {
    const p = document.getElementById("ed-painel");
    if (!p) return;
    p.hidden = !ligado;
    document.body.classList.toggle("ed-ligado", ligado);
    const bt = document.getElementById("ed-alternar");
    if (bt) { bt.setAttribute("aria-pressed", String(ligado)); bt.textContent = ligado ? "Sair da edição (E)" : "Editar (E)"; }
    const fl = document.getElementById("ed-flutuante");
    if (fl) fl.setAttribute("aria-pressed", String(ligado));
    if (!ligado) return;
    // não redesenha enquanto o usuário digita no painel
    const ativo = document.activeElement;
    if (ativo && p.contains(ativo) && (ativo.tagName === "TEXTAREA" || ativo.type === "number")) return;
    p.querySelector("[data-corpo]").innerHTML = aba === "inspetor" ? htmlInspetor() : aba === "tema" ? htmlTema() : htmlArquivo();
    p.querySelectorAll("[data-aba]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.aba === aba)));
    document.getElementById("ed-desfazer").disabled = !historico.length;
    document.getElementById("ed-refazer").disabled = !futuro.length;
  }

  function montarPainel() {
    const p = document.createElement("aside");
    p.id = "ed-painel"; p.className = "ed-painel"; p.hidden = true; p.setAttribute("aria-label", "Painel de edição");
    p.innerHTML = `<div class="ed-topo"><b>Edição</b>
        <button class="ed-ic" id="ed-desfazer" title="Desfazer (Ctrl+Z)" aria-label="Desfazer">↶</button>
        <button class="ed-ic" id="ed-refazer" title="Refazer (Ctrl+Shift+Z)" aria-label="Refazer">↷</button>
        <button class="ed-ic" id="ed-fechar" title="Sair da edição (E)" aria-label="Sair da edição">✕</button></div>
      <div class="ed-abas" role="tablist"><button role="tab" data-aba="inspetor">Inspetor</button><button role="tab" data-aba="tema">Tema</button><button role="tab" data-aba="arquivo">Salvar / Figma</button></div>
      <div class="ed-corpo" data-corpo></div>
      <div class="ed-rodape" id="ed-salvo">Salvo neste navegador</div>`;
    document.body.appendChild(p);

    p.querySelector("#ed-desfazer").onclick = desfazer;
    p.querySelector("#ed-refazer").onclick = refazer;
    p.querySelector("#ed-fechar").onclick = () => alternar(false);
    p.querySelectorAll("[data-aba]").forEach((b) => (b.onclick = () => { aba = b.dataset.aba; atualizarPainel(); }));

    const corpo = p.querySelector("[data-corpo]");
    corpo.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.p && t.type === "color") { selecionado.style[t.dataset.p] = t.value; posicionar(); }
      if (t.dataset.p && t.type === "range") { selecionado.style.opacity = t.value; }
      if (t.dataset.token) document.documentElement.style.setProperty(t.dataset.token, t.value);
    });
    corpo.addEventListener("change", (e) => {
      const t = e.target;
      if (t.id === "ed-texto") {
        const no = textosDiretos(selecionado)[0]; if (!no) return;
        const orig = textoOriginal(no), novo = t.value.trim();
        t.blur();
        mudar(() => { if (!novo || novo === orig) delete ed.textos[orig]; else ed.textos[orig] = novo; });
        return;
      }
      if (t.dataset.p) {
        const v = t.type === "number" ? (t.value === "" ? null : t.value + t.dataset.u) : t.value;
        if (t.dataset.p === "borderWidth" && v && !selecionado.style.borderStyle && getComputedStyle(selecionado).borderStyle === "none") setEstilo("borderStyle", "solid");
        t.blur(); setEstilo(t.dataset.p, v); return;
      }
      if (t.dataset.token) {
        document.documentElement.style.removeProperty(t.dataset.token);
        const modo = temaEscuro() ? "escuro" : "claro";
        mudar(() => { ed.tokens[modo][t.dataset.token] = t.value; });
        return;
      }
      if (t.matches("[data-abrir-json]") && t.files[0]) {
        t.files[0].text().then((s) => { const o = normalizar(JSON.parse(s)); mudar(() => { ed = o; }); reRender(); marcarSalvo("Edição aberta"); })
          .catch(() => marcarSalvo("Arquivo inválido"));
      }
    });
    corpo.addEventListener("keydown", (e) => { if (e.target.id === "ed-texto" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.target.dispatchEvent(new Event("change", { bubbles: true })); } });
    corpo.addEventListener("click", async (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.limpa) setEstilo(b.dataset.limpa, null);
      else if (b.dataset.limpaToken) { const modo = temaEscuro() ? "escuro" : "claro"; mudar(() => { delete ed.tokens[modo][b.dataset.limpaToken]; }); }
      else if (b.hasAttribute("data-limpar-tema")) { const modo = temaEscuro() ? "escuro" : "claro"; mudar(() => { ed.tokens[modo] = {}; }); }
      else if (b.hasAttribute("data-ocultar")) {
        const k = chaveSel(); const oculto = ed.estilos[k] && ed.estilos[k].display === "none";
        setEstilo("display", oculto ? null : "none");
      } else if (b.hasAttribute("data-limpar-el")) {
        const k = chaveSel(); const el = selecionado;
        mudar(() => { for (const p of Object.keys(ed.estilos[k] || {})) el.style[p] = ""; delete ed.estilos[k]; });
      } else if (b.hasAttribute("data-texto-orig")) {
        const no = textosDiretos(selecionado)[0]; const orig = textoOriginal(no);
        mudar(() => { delete ed.textos[orig]; }); no.nodeValue = no.nodeValue.replace(no.nodeValue.trim(), orig); atualizarPainel();
      } else if (b.hasAttribute("data-baixar-json")) {
        baixar("edicao.json", JSON.stringify(ed, null, 2), "application/json"); marcarSalvo("edicao.json baixado");
      } else if (b.hasAttribute("data-publicada")) {
        const o = await carregarPublicada();
        if (!o) { marcarSalvo("Nenhum edicao.json publicado"); return; }
        mudar(() => { ed = o; }); reRender(); marcarSalvo("Versão publicada carregada");
      } else if (b.hasAttribute("data-zerar")) {
        if (!confirmarNoPainel(b)) return;
        mudar(() => { for (const k of Object.keys(ed.estilos)) { const el = k.startsWith(rotaNome() + "|") && elementoDe(k.split("|")[1]); if (el) for (const p of Object.keys(ed.estilos[k])) el.style[p] = ""; } ed = vazia(); });
        reRender();
      } else if (b.dataset.fig) {
        b.disabled = true; const txt = b.textContent; b.textContent = "Gerando…";
        try {
          if (b.dataset.fig === "todas") { baixar("agorahub-telas.svg", await svgTodasAsTelas(), "image/svg+xml"); marcarSalvo("SVG com todas as telas baixado"); }
          else {
            const svg = svgDaTela();
            if (b.dataset.fig === "baixar") { baixar(`agorahub-${rotaNome()}.svg`, svg, "image/svg+xml"); marcarSalvo("SVG baixado"); }
            else { await copiar(svg); marcarSalvo("Copiado! No Figma, aperte Ctrl+V"); }
          }
        } catch (err) { console.error(err); marcarSalvo("Não foi possível gerar o SVG"); }
        b.disabled = false; b.textContent = txt;
      }
    });
  }
  function confirmarNoPainel(b) {
    if (b.dataset.confirmando) return true;
    b.dataset.confirmando = "1"; b.textContent = "Clique de novo para confirmar";
    setTimeout(() => { if (b.isConnected) { delete b.dataset.confirmando; b.textContent = "Descartar todas as edições"; } }, 3000);
    return false;
  }
  function baixar(nome, conteudo, tipo) {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const a = document.createElement("a"); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  async function copiar(txt) {
    try { await navigator.clipboard.writeText(txt); return; } catch (_) {}
    const ta = document.createElement("textarea"); ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }

  function alternar(forcar) {
    ligado = typeof forcar === "boolean" ? forcar : !ligado;
    if (!ligado) { selecionado = null; ov.hover.hidden = true; }
    posicionar(); atualizarPainel();
  }

  // ================================================================ Exportar para o Figma (DOM → SVG em camadas)
  function rgba(c) {
    const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1;
    if (a === 0) return null;
    return { hex: "#" + p.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, "0")).join(""), a };
  }
  const fill = (c, attr = "fill") => (c ? `${attr}="${c.hex}"${c.a < 1 ? ` ${attr}-opacity="${+c.a.toFixed(3)}"` : ""}` : `${attr}="none"`);
  const n2 = (x) => +x.toFixed(2);

  function svgDe(raiz, ox, oy, prefixo) {
    let ids = 0; const usados = {};
    const out = [];
    const defs = [];
    const R = raiz.getBoundingClientRect();
    const id = (base) => {
      base = String(base || "camada").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "camada";
      usados[base] = (usados[base] || 0) + 1;
      return esc(prefixo + base + (usados[base] > 1 ? "-" + usados[base] : ""));
    };
    const X = (x) => n2(x - R.left + ox), Y = (y) => n2(y - R.top + oy);

    function texto(no, cs, clip) {
      const bruto = no.nodeValue; if (!bruto.trim()) return;
      const fs = parseFloat(cs.fontSize);
      const linhas = []; const re = /\S+\s*/g; let m;
      const rg = document.createRange();
      while ((m = re.exec(bruto))) {
        rg.setStart(no, m.index); rg.setEnd(no, m.index + m[0].trimEnd().length);
        const rs = rg.getClientRects(); if (!rs.length) continue;
        const r = rs[0]; if (!r.width) continue;
        let l = linhas.find((x) => Math.abs(x.top - r.top) < fs * 0.5);
        if (!l) { l = { top: r.top, left: r.left, h: r.height, txt: "" }; linhas.push(l); }
        l.txt += m[0]; l.left = Math.min(l.left, r.left);
      }
      const c = rgba(cs.color);
      const tt = cs.textTransform;
      for (const l of linhas) {
        if (clip && (l.top > clip.bottom || l.top + l.h < clip.top)) continue;
        let t = l.txt.replace(/\s+/g, " ").trim();
        if (tt === "uppercase") t = t.toUpperCase();
        const base = l.top + l.h / 2 + fs * 0.35;
        const ls = parseFloat(cs.letterSpacing);
        out.push(`<text id="${id(t.slice(0, 24))}" x="${X(l.left)}" y="${Y(base)}" font-family="Roboto, ${esc(cs.fontFamily.split(",")[0].replace(/"/g, ""))}" font-size="${n2(fs)}" font-weight="${cs.fontWeight}"${ls ? ` letter-spacing="${n2(ls)}"` : ""} ${fill(c)}>${esc(t)}</text>`);
      }
    }

    function caixa(el, cs, r, nome) {
      let bg = rgba(cs.backgroundColor);
      if (!bg && /gradient/.test(cs.backgroundImage)) { const m = cs.backgroundImage.match(/rgba?\([^)]+\)/); if (m) bg = rgba(m[0]); }
      const rx = parseFloat(cs.borderTopLeftRadius) || 0;
      const lados = ["Top", "Right", "Bottom", "Left"].map((s) => ({ w: parseFloat(cs[`border${s}Width`]) || 0, c: rgba(cs[`border${s}Color`]), st: cs[`border${s}Style`] }));
      const uniforme = lados.every((l) => l.w === lados[0].w && l.st === lados[0].st && l.c && lados[0].c && l.c.hex === lados[0].c.hex) && lados[0].w > 0 && lados[0].st !== "none";
      const rr = Math.min(rx, r.width / 2, r.height / 2);
      if (bg || uniforme) {
        const sw = uniforme ? lados[0].w : 0;
        out.push(`<rect id="${id(nome + "-fundo")}" x="${X(r.left + sw / 2)}" y="${Y(r.top + sw / 2)}" width="${n2(Math.max(0, r.width - sw))}" height="${n2(Math.max(0, r.height - sw))}"${rr ? ` rx="${n2(rr)}"` : ""} ${fill(bg)}${uniforme ? ` ${fill(lados[0].c, "stroke")} stroke-width="${n2(sw)}"` : ""}/>`);
      }
      if (!uniforme) lados.forEach((l, i) => {
        if (!l.w || !l.c || l.st === "none") return;
        const g = [[r.left, r.top, r.width, l.w], [r.right - l.w, r.top, l.w, r.height], [r.left, r.bottom - l.w, r.width, l.w], [r.left, r.top, l.w, r.height]][i];
        out.push(`<rect id="${id(nome + "-borda")}" x="${X(g[0])}" y="${Y(g[1])}" width="${n2(g[2])}" height="${n2(g[3])}" ${fill(l.c)}/>`);
      });
    }

    function icone(svg, cs, r) {
      const vb = (svg.getAttribute("viewBox") || "0 0 24 24").split(/[\s,]+/).map(Number);
      const s = Math.min(r.width / vb[2], r.height / vb[3]);
      const c = rgba(cs.color);
      const paths = [...svg.querySelectorAll("path")].map((p) => `<path d="${esc(p.getAttribute("d"))}" ${fill(p.getAttribute("fill") && p.getAttribute("fill") !== "currentColor" ? rgba(getComputedStyle(p).fill) : c)}/>`).join("");
      out.push(`<g id="${id("icone")}" transform="translate(${X(r.left)} ${Y(r.top)}) scale(${n2(s)})">${paths}</g>`);
    }

    function campo(el, cs, r) {
      let t = el.tagName === "SELECT" ? (el.selectedOptions[0] || {}).text : el.value;
      let cor = rgba(cs.color);
      if (!t && el.placeholder) { t = el.placeholder; cor = { hex: "#73777F", a: 1 }; }
      if (el.type === "password" && el.value) t = "•".repeat(el.value.length);
      if (!t || el.type === "checkbox" || el.type === "radio" || el.type === "color" || el.type === "range" || el.type === "file") return;
      const fs = parseFloat(cs.fontSize);
      const pl = parseFloat(cs.paddingLeft);
      const y = el.tagName === "TEXTAREA" ? r.top + parseFloat(cs.paddingTop) + fs : r.top + r.height / 2 + fs * 0.35;
      out.push(`<text id="${id("valor")}" x="${X(r.left + pl)}" y="${Y(y)}" font-family="Roboto" font-size="${n2(fs)}" ${fill(cor)}>${esc(t)}</text>`);
    }

    function andar(el, clip) {
      if (el.nodeType !== 1 || el.classList.contains("snack") || el.id === "ed-painel" || /^ed-/.test(el.className)) return;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return;
      const r = el.getBoundingClientRect();
      if (clip && (r.bottom < clip.top || r.top > clip.bottom || r.right < clip.left || r.left > clip.right) && cs.position !== "absolute") return;
      const nome = (el.classList[0] || el.tagName.toLowerCase());
      const op = +cs.opacity;
      out.push(`<g id="${id(nome)}"${op < 1 ? ` opacity="${op}"` : ""}>`);
      caixa(el, cs, r, nome);
      if (el.tagName === "svg" || el.tagName === "SVG") { icone(el, cs, r); out.push("</g>"); return; }
      if (el.tagName === "IMG") { out.push(`<image href="${esc(el.currentSrc || el.src)}" x="${X(r.left)}" y="${Y(r.top)}" width="${n2(r.width)}" height="${n2(r.height)}"/>`); }
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) campo(el, cs, r);
      if (el.tagName === "INPUT" && (el.type === "radio" || el.type === "checkbox") && el.type === "radio") {
        const c = rgba(cs.accentColor) || { hex: "#1F3A5F", a: 1 };
        out.push(`<circle cx="${X(r.left + r.width / 2)}" cy="${Y(r.top + r.height / 2)}" r="${n2(r.width / 2 - 1)}" fill="none" ${fill(c, "stroke")} stroke-width="2"/>${el.checked ? `<circle cx="${X(r.left + r.width / 2)}" cy="${Y(r.top + r.height / 2)}" r="${n2(r.width / 4)}" ${fill(c)}/>` : ""}`);
      }
      let novoClip = clip;
      const recorta = cs.overflow !== "visible" || cs.overflowX !== "visible" || cs.overflowY !== "visible";
      if (recorta) {
        novoClip = clip ? { left: Math.max(clip.left, r.left), top: Math.max(clip.top, r.top), right: Math.min(clip.right, r.right), bottom: Math.min(clip.bottom, r.bottom) } : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        const cid = prefixo + "clip" + ++ids;
        const rx = parseFloat(cs.borderTopLeftRadius) || 0;
        defs.push(`<clipPath id="${cid}"><rect x="${X(r.left)}" y="${Y(r.top)}" width="${n2(r.width)}" height="${n2(r.height)}"${rx ? ` rx="${n2(rx)}"` : ""}/></clipPath>`);
        out.push(`<g clip-path="url(#${cid})">`);
      }
      for (const f of el.childNodes) {
        if (f.nodeType === 3) texto(f, cs, novoClip);
        else andar(f, novoClip);
      }
      if (recorta) out.push("</g>");
      out.push("</g>");
    }
    andar(raiz, null);
    return { corpo: out.join(""), defs: defs.join(""), w: R.width, h: R.height };
  }

  function envolver(partes, W, H) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${Math.ceil(W)}" height="${Math.ceil(H)}" viewBox="0 0 ${Math.ceil(W)} ${Math.ceil(H)}">
<defs>${partes.map((p) => p.defs).join("")}</defs>
${partes.map((p) => p.corpo).join("\n")}
</svg>`;
  }

  /** Mostra a tela inteira (sem rolagem) enquanto mede. */
  async function semRolagem(fn) {
    const estavaLigado = ligado; ligado = false; posicionar();
    document.body.classList.add("ed-exportando");
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try { return await fn(); }
    finally { document.body.classList.remove("ed-exportando"); ligado = estavaLigado; posicionar(); atualizarPainel(); }
  }

  function svgDaTela() {
    const app = document.getElementById("app");
    document.body.classList.add("ed-exportando");
    const estavaLigado = ligado; ligado = false;
    try {
      const p = svgDe(app, 0, 0, "");
      return envolver([{ defs: p.defs, corpo: `<g id="${esc((document.title || "Tela").replace(/ · .*/, ""))}">${p.corpo}</g>` }], p.w, p.h);
    } finally { document.body.classList.remove("ed-exportando"); ligado = estavaLigado; posicionar(); }
  }

  async function svgTodasAsTelas() {
    const B = AH.banco;
    if (!B.eu) throw new Error("Entre com uma conta para exportar as telas.");
    const hashAntes = location.hash;
    const projeto = (B.vitrine()[0] || Object.values({})[0] || {}).id || "";
    const pessoa = (B.diretorio("", "")[0] || { u: {} }).u.uid || "";
    const telas = [["home", "T08 Mural"], ...(B.eu.papel === "admin" ? [["publicar", "T17 Publicar oportunidade"]] : []),
      ["conexoes", "T09 Conexões · Projetos"], ["conexoes?seg=pessoas", "T19 Conexões · Pessoas"],
      ...(projeto ? [["projeto/" + projeto, "T10 Detalhe do projeto"]] : []), ["novo-projeto", "T11 Novo projeto"],
      ...(pessoa ? [["pessoa/" + pessoa, "T20 Perfil do estudante"]] : []),
      ["perfil", "T12 Perfil"], ["editar-perfil", "T13 Editar perfil"], ["recebidas", "T14 Solicitações recebidas"],
      ["minhas", "T15 Minhas solicitações"], ["meus-projetos", "T16 Meus projetos"], ["privacidade", "T18 Privacidade e dados"]];
    const partes = []; let x = 0; let H = 0; const GAP = 80, TOPO = 56;
    return semRolagem(async () => {
      for (const [r, nome] of telas) {
        history.replaceState(null, "", "#/" + r); AH.render();
        await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
        const app = document.getElementById("app");
        const p = svgDe(app, x, TOPO, `t${partes.length}-`);
        partes.push({ defs: p.defs, corpo: `<g id="${esc(nome)}"><text x="${x}" y="32" font-family="Roboto" font-size="22" font-weight="600" fill="#1A1C1E">${esc(nome)}</text>${p.corpo}</g>` });
        x += p.w + GAP; H = Math.max(H, p.h + TOPO);
      }
      history.replaceState(null, "", hashAntes); AH.render();
      return envolver(partes, x - GAP, H);
    });
  }

  // ================================================================ Início
  async function iniciar() {
    const local = lerLocal();
    if (local) ed = normalizar(local);
    else { const pub = await carregarPublicada(); if (pub) ed = pub; }
    criarOverlays(); montarPainel(); ligarEventos();
    const bt = document.getElementById("ed-alternar"); if (bt) bt.onclick = () => alternar();
    const fl = document.createElement("button");
    fl.id = "ed-flutuante"; fl.className = "ed-flutuante"; fl.title = "Editar (E)"; fl.setAttribute("aria-label", "Modo de edição");
    fl.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
    fl.onclick = () => alternar();
    document.body.appendChild(fl);
    if (/[?&]editar\b/.test(location.search)) alternar(true);
    aplicarTudo(); atualizarPainel();
  }

  AH.editor = { aposRender, alternar, get dados() { return ed; }, svgDaTela, svgTodasAsTelas };
  aplicarTokens(); // cores salvas antes do primeiro desenho
  try { const l = lerLocal(); if (l) { ed = normalizar(l); aplicarTokens(); } } catch (_) {}
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
