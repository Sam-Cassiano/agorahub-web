/*
 * ÁgoraHub Web — protótipo navegável das 20 telas do app Android (T01–T20).
 * JavaScript puro, sem build: roteamento por hash (#/rota), telas montadas como HTML.
 */
(function () {
  const B = AH.banco;
  const V = AH.V;

  // ================================================================ Utilidades
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const tagNome = (id) => (AH.TAGS.find((t) => t.id === id) || { nome: id }).nome;
  const data = (ms) => new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const iniciais = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const plural = (n, um, varios) => (n === 1 ? um : varios.replace("%d", n));

  const P = {
    voltar: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    pessoas: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    perfil: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    link: "M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z",
    editar: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    inbox: "M19 3H4.99C3.88 3 3 3.9 3 5v14c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z",
    enviar: "M2.01 21 23 12 2.01 3 2 10l15 2-15 2z",
    pasta: "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
    sino: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
    paleta: "M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
    escudo: "M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
    sair: "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
    seta: "M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
    copiar: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
    email: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z",
    megafone: "M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z",
    restaurar: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18z",
  };
  const ic = (nome) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="${P[nome]}"/></svg>`;

  // ================================================================ Tema (Perfil › Aparência)
  const temaSalvo = () => { try { return localStorage.getItem("agorahub-tema") || "sistema"; } catch (_) { return "sistema"; } };
  function aplicarTema(t) {
    if (t === "sistema") document.documentElement.removeAttribute("data-tema");
    else document.documentElement.setAttribute("data-tema", t);
    try { localStorage.setItem("agorahub-tema", t); } catch (_) {}
  }
  aplicarTema(temaSalvo());

  // ================================================================ Rotas
  function rotaAtual() {
    const h = location.hash.replace(/^#\/?/, "");
    const [caminho, qs] = h.split("?");
    const partes = caminho.split("/").filter(Boolean);
    const q = Object.fromEntries(new URLSearchParams(qs || ""));
    return { nome: partes[0] || "", partes, q };
  }
  const ir = (r) => { location.hash = "#/" + r; };
  let profundidade = 0, substituindo = false;
  const trocar = (r) => { substituindo = true; location.replace("#/" + r); };
  window.addEventListener("hashchange", () => { if (substituindo) substituindo = false; else profundidade++; render(); });
  function voltar(padrao) {
    if (profundidade > 0) { profundidade -= 2; history.back(); } else ir(padrao);
  }

  // ================================================================ Snackbar e diálogos
  let snackTimer;
  function snack(msg) {
    const app = document.getElementById("app");
    app.querySelectorAll(".snack").forEach((s) => s.remove());
    const el = document.createElement("div");
    el.className = "snack" + (app.querySelector(".nav") ? "" : " sem-nav");
    el.setAttribute("role", "status");
    el.textContent = msg;
    app.appendChild(el);
    clearTimeout(snackTimer);
    snackTimer = setTimeout(() => el.remove(), 4200);
  }

  /** Abre um diálogo; `corpo` é HTML; retorna Promise com os dados do form ou null. */
  function dialogo({ titulo, corpo = "", confirmar = "Confirmar", destrutivo = false, validar }) {
    return new Promise((resolve) => {
      const app = document.getElementById("app");
      const fundo = document.createElement("div");
      fundo.className = "fundo-dialogo";
      fundo.innerHTML = `<form class="dialogo" role="dialog" aria-modal="true" aria-labelledby="dlg-t">
        <h2 id="dlg-t">${esc(titulo)}</h2>${corpo}
        <div class="acoes"><button type="button" class="btn btn-texto" data-c>Cancelar</button>
        <button type="submit" class="btn btn-texto ${destrutivo ? "btn-perigo" : ""}" data-ok>${esc(confirmar)}</button></div></form>`;
      app.appendChild(fundo);
      const form = fundo.querySelector("form");
      const fechar = (v) => { fundo.remove(); resolve(v); };
      fundo.querySelector("[data-c]").onclick = () => fechar(null);
      fundo.addEventListener("click", (e) => { if (e.target === fundo) fechar(null); });
      fundo.addEventListener("keydown", (e) => { if (e.key === "Escape") fechar(null); });
      const ok = fundo.querySelector("[data-ok]");
      const atualizar = () => { if (validar) ok.disabled = !validar(new FormData(form)); };
      form.addEventListener("input", atualizar); form.addEventListener("change", atualizar); atualizar();
      form.onsubmit = (e) => { e.preventDefault(); fechar(Object.fromEntries(new FormData(form))); };
      (form.querySelector("input,textarea") || ok).focus();
    });
  }

  /** Executa uma ação com carregamento no botão e trata ErroApp. */
  async function acao(btn, fn, erroEl) {
    const html = btn ? btn.innerHTML : "";
    if (btn) { btn.disabled = true; btn.innerHTML = `<span class="giro" aria-hidden="true"></span><span class="sr-only">Carregando</span>`; }
    if (erroEl) erroEl.hidden = true;
    try { return await fn(); }
    catch (e) {
      const msg = e instanceof AH.ErroApp ? e.message : "Algo deu errado. Tente de novo em instantes.";
      if (erroEl) { erroEl.textContent = msg; erroEl.hidden = false; } else snack(msg);
      if (!(e instanceof AH.ErroApp)) console.error(e);
      throw e;
    } finally {
      if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = html; }
    }
  }
  const silencioso = (p) => p.catch(() => {});

  // ================================================================ Componentes
  const tagsHtml = (ids, minhas = []) => `<div class="tags">${ids.map((t) => `<span class="tag ${minhas.includes(t) ? "comum" : ""}">${esc(tagNome(t))}</span>`).join("")}</div>`;
  const statusHtml = (s, rot) => `<span class="status ${s}">${esc(rot)}</span>`;
  const vagasTxt = (n) => (n === 1 ? "1 vaga disponível" : `${n} vagas disponíveis`);
  const emComumTxt = (n) => (n === 0 ? "Nenhum interesse em comum" : n === 1 ? "1 interesse em comum" : `${n} interesses em comum`);
  const vazio = (icone, msg, acaoHtml = "") => `<div class="vazio">${ic(icone)}<p>${esc(msg)}</p>${acaoHtml}</div>`;

  function campo({ id, rotulo, tipo = "text", valor = "", dica = "", ajuda = "", limite, linhas, auto }) {
    const atributos = `id="${id}" name="${id}" ${limite ? `maxlength="${limite}"` : ""} ${auto ? `autocomplete="${auto}"` : ""} placeholder="${esc(dica)}"`;
    const entrada = linhas
      ? `<textarea ${atributos} rows="${linhas}">${esc(valor)}</textarea>`
      : tipo === "password"
        ? `<div class="senha-wrap"><input type="password" ${atributos} value="${esc(valor)}"><button type="button" class="btn btn-texto" data-ver-senha aria-label="Mostrar senha">Mostrar</button></div>`
        : `<input type="${tipo}" ${atributos} value="${esc(valor)}">`;
    const contador = limite && linhas ? `<span data-contador="${id}">${valor.length}/${limite}</span>` : "";
    return `<div class="campo" data-campo="${id}"><label for="${id}">${esc(rotulo)}</label>${entrada}
      <div class="msg-erro" hidden></div>${ajuda || contador ? `<div class="ajuda"><span>${esc(ajuda)}</span>${contador}</div>` : ""}</div>`;
  }
  function erroCampo(raiz, id, msg) {
    const c = raiz.querySelector(`[data-campo="${id}"]`);
    if (!c) return;
    c.classList.toggle("erro", !!msg);
    const m = c.querySelector(".msg-erro");
    m.textContent = msg || ""; m.hidden = !msg;
  }
  function ligarCampos(raiz) {
    raiz.querySelectorAll("[data-ver-senha]").forEach((b) => {
      b.onclick = () => {
        const i = b.previousElementSibling;
        const mostrar = i.type === "password";
        i.type = mostrar ? "text" : "password";
        b.textContent = mostrar ? "Ocultar" : "Mostrar";
        b.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
      };
    });
    raiz.querySelectorAll("[data-contador]").forEach((s) => {
      const i = raiz.querySelector("#" + s.dataset.contador);
      i.addEventListener("input", () => { s.textContent = `${i.value.length}/${i.maxLength}`; });
    });
  }

  /** Seletor de tags agrupado (T06, T11, T13). */
  function seletorTags(selecionadas, max) {
    const grupos = [...new Set(AH.TAGS.map((t) => t.grupo))];
    return `<div data-seletor-tags data-max="${max}">${grupos.map((g) => `<div class="grupo-tags"><h3>${esc(g)}</h3><div class="tags">
      ${AH.TAGS.filter((t) => t.grupo === g).map((t) => `<button type="button" class="chip" role="checkbox" aria-checked="${selecionadas.includes(t.id)}" data-tag="${t.id}" title="${esc(t.descricao)}">${esc(t.nome)}</button>`).join("")}
      </div></div>`).join("")}</div>`;
  }
  function ligarSeletor(raiz, selecionadas, aoMudar, msgLimite) {
    const el = raiz.querySelector("[data-seletor-tags]");
    const max = Number(el.dataset.max);
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tag]");
      if (!b) return;
      const id = b.dataset.tag;
      const i = selecionadas.indexOf(id);
      if (i >= 0) selecionadas.splice(i, 1);
      else if (selecionadas.length >= max) { snack(msgLimite); return; }
      else selecionadas.push(id);
      b.setAttribute("aria-checked", String(selecionadas.includes(id)));
      aoMudar();
    });
  }

  // ================================================================ Telas
  const T = {};

  // ---------------- T01 · Abertura
  T.abertura = () => ({
    semTopo: true, nav: false,
    html: `<div class="capa"><div class="logo" aria-hidden="true">Á</div><h1>ÁgoraHub</h1>
      <p>Oportunidades, projetos e pessoas do IFAL Arapiraca em um só lugar.</p></div>
      <div class="cartao" style="margin-top:24px">
        <h2>Modo demonstração</h2>
        <p class="meta">Sem Firebase: os dados são de exemplo e ficam só neste navegador. Entre com <b>${AH.EMAIL_DEMO}</b> e a senha <b>${AH.SENHA_PADRAO}</b>.</p>
        <button class="btn btn-tonal btn-bloco" data-demo>Usar conta de demonstração</button>
      </div>
      <a class="btn btn-primario btn-bloco" href="#/login">Entrar</a><div class="espaco"></div>
      <a class="btn btn-contorno btn-bloco" href="#/cadastro">Criar conta</a>
      <p class="meta" style="text-align:center;margin-top:20px"><a href="#/privacidade">Ver privacidade e dados</a></p>`,
    ligar(r) { r.querySelector("[data-demo]").onclick = (e) => silencioso(acao(e.currentTarget, () => B.entrar(AH.EMAIL_DEMO, AH.SENHA_PADRAO)).then(() => ir("home"))); },
  });

  // ---------------- T02 · Entrar
  T.login = () => ({
    titulo: "Entrar no ÁgoraHub", voltarPara: "abertura", nav: false,
    html: `<p class="meta">Só para estudantes do IFAL.</p>
      <form novalidate data-f>
        <div class="alerta erro" role="alert" hidden data-erro></div>
        ${campo({ id: "email", rotulo: "E-mail institucional", tipo: "email", dica: "nome@aluno.ifal.edu.br", auto: "username" })}
        ${campo({ id: "senha", rotulo: "Senha", tipo: "password", auto: "current-password" })}
        <button class="btn btn-primario btn-bloco" type="submit">Entrar</button>
      </form>
      <div class="espaco"></div>
      <a class="btn btn-texto btn-bloco" href="#/recuperar" data-esqueci>Esqueci minha senha</a>
      <a class="btn btn-texto btn-bloco" href="#/cadastro">Criar conta</a>
      <div class="alerta aviso" style="margin-top:16px">Demonstração: use <b>${AH.EMAIL_DEMO}</b> ou marina@, pedro@, camila@, isabela@, theo@, bianca@ — senha <b>${AH.SENHA_PADRAO}</b>.</div>`,
    ligar(r) {
      ligarCampos(r);
      r.querySelector("[data-esqueci]").onclick = (e) => { e.preventDefault(); ir("recuperar?email=" + encodeURIComponent(r.querySelector("#email").value)); };
      r.querySelector("[data-f]").onsubmit = (e) => {
        e.preventDefault();
        const email = r.querySelector("#email").value, senha = r.querySelector("#senha").value;
        erroCampo(r, "email", !email.trim() ? "Preencha este campo." : !V.emailInstitucional(email) ? "Use seu e-mail institucional (@aluno.ifal.edu.br)." : "");
        erroCampo(r, "senha", !senha ? "Preencha este campo." : "");
        if (!V.emailInstitucional(email) || !senha) return;
        silencioso(acao(e.submitter, () => B.entrar(email, senha), r.querySelector("[data-erro]")).then(render));
      };
    },
  });

  // ---------------- T03 · Criar conta
  T.cadastro = () => ({
    titulo: "Criar conta", voltarPara: "abertura", nav: false,
    html: `<form novalidate data-f>
        <div class="alerta erro" role="alert" hidden data-erro></div>
        ${campo({ id: "email", rotulo: "E-mail institucional", tipo: "email", dica: "nome@aluno.ifal.edu.br", auto: "username" })}
        ${campo({ id: "senha", rotulo: "Senha", tipo: "password", ajuda: "Pelo menos 8 caracteres.", auto: "new-password" })}
        ${campo({ id: "senha2", rotulo: "Confirmar senha", tipo: "password", auto: "new-password" })}
        <p class="meta">Usamos seu e-mail apenas para login e, se você autorizar, para contato em projetos. <a href="#/privacidade">Ver privacidade e dados</a></p>
        <button class="btn btn-primario btn-bloco" type="submit">Criar conta</button>
      </form><div class="espaco"></div>
      <a class="btn btn-texto btn-bloco" href="#/login">Já tenho conta</a>`,
    ligar(r) {
      ligarCampos(r);
      r.querySelector("[data-f]").onsubmit = (e) => {
        e.preventDefault();
        const email = r.querySelector("#email").value, s1 = r.querySelector("#senha").value, s2 = r.querySelector("#senha2").value;
        const eE = !email.trim() ? "Preencha este campo." : !V.emailInstitucional(email) ? "Use seu e-mail institucional (@aluno.ifal.edu.br)." : "";
        const eS = !V.senhaValida(s1) ? "A senha precisa ter pelo menos 8 caracteres." : "";
        const eS2 = s1 !== s2 ? "As senhas não são iguais." : "";
        erroCampo(r, "email", eE); erroCampo(r, "senha", eS); erroCampo(r, "senha2", eS2);
        if (eE || eS || eS2) return;
        silencioso(acao(e.submitter, () => B.criarConta(email, s1), r.querySelector("[data-erro]")).then(() => ir("verificacao")));
      };
    },
  });

  // ---------------- T04 · Verifique seu e-mail
  T.verificacao = () => ({
    titulo: "Verifique seu e-mail", nav: false,
    html: `<div class="capa" style="padding-top:16px"><div class="logo" aria-hidden="true">${ic("email")}</div></div>
      <p>Enviamos um link de confirmação para <b>${esc(B.email)}</b>. Abra o link e depois toque em “Já verifiquei”.</p>
      <p class="meta">Não achou? Confira a caixa de spam.</p>
      <div class="alerta aviso">Demonstração: “Já verifiquei” simula o clique no link do e-mail.</div>
      <button class="btn btn-primario btn-bloco" data-ok>Já verifiquei</button><div class="espaco"></div>
      <button class="btn btn-contorno btn-bloco" data-reenviar>Reenviar link</button><div class="espaco"></div>
      <button class="btn btn-texto btn-bloco" data-sair>Sair</button>`,
    ligar(r) {
      r.querySelector("[data-ok]").onclick = (e) => silencioso(acao(e.currentTarget, () => B.verificarEmail()).then(() => ir("onboarding")));
      const rb = r.querySelector("[data-reenviar]");
      rb.onclick = () => {
        snack("Link reenviado.");
        let s = 60; rb.disabled = true;
        const t = setInterval(() => { s--; rb.textContent = `Reenviar em ${s} s`; if (s <= 0 || !rb.isConnected) { clearInterval(t); rb.disabled = false; rb.textContent = "Reenviar link"; } }, 1000);
      };
      r.querySelector("[data-sair]").onclick = () => { B.sair(); ir("abertura"); };
    },
  });

  // ---------------- T05 · Recuperar senha
  T.recuperar = ({ q }) => ({
    titulo: "Recuperar senha", voltarPara: "login", nav: false,
    html: `<p>Informe seu e-mail institucional. Vamos enviar um link para você criar uma nova senha.</p>
      <form novalidate data-f><div class="alerta ok" role="status" hidden data-ok>Se houver uma conta com este e-mail, enviamos um link para criar uma nova senha.</div>
      ${campo({ id: "email", rotulo: "E-mail institucional", tipo: "email", valor: q.email || "", dica: "nome@aluno.ifal.edu.br" })}
      <button class="btn btn-primario btn-bloco" type="submit">Enviar link</button></form>`,
    ligar(r) {
      r.querySelector("[data-f]").onsubmit = (e) => {
        e.preventDefault();
        const email = r.querySelector("#email").value;
        const err = V.emailInstitucional(email) ? "" : "Use seu e-mail institucional (@aluno.ifal.edu.br).";
        erroCampo(r, "email", err);
        if (err) return;
        silencioso(acao(e.submitter, () => B.enviarRedefinicao(email)).then(() => { r.querySelector("[data-ok]").hidden = false; }));
      };
    },
  });

  // ---------------- T06 · Onboarding (e T13 · Editar perfil, mesma estrutura)
  function telaPerfilForm(modo) {
    const eu = B.eu;
    const editar = modo === "editar";
    const sel = editar ? eu.tags.slice() : [];
    const cursoAtual = editar ? eu.curso : "Sistemas de Informação";
    const ehSI = cursoAtual === "Sistemas de Informação";
    return {
      titulo: editar ? "Editar perfil" : "Complete seu perfil",
      voltarPara: editar ? "perfil" : null, nav: false,
      html: `<form novalidate data-f>
        ${campo({ id: "nome", rotulo: "Nome", valor: editar ? eu.nome : "", limite: V.NOME_MAX, auto: "name" })}
        <fieldset class="campo" style="border:0;padding:0;margin:0 0 16px"><legend style="font-size:14px;font-weight:500;margin-bottom:4px">Curso</legend>
          <label class="radio"><input type="radio" name="curso" value="si" ${ehSI ? "checked" : ""}> Sistemas de Informação</label>
          <label class="radio"><input type="radio" name="curso" value="outro" ${ehSI ? "" : "checked"}> Outro curso</label>
          <div data-outro ${ehSI ? "hidden" : ""}>${campo({ id: "outroCurso", rotulo: "Nome do curso", valor: ehSI ? "" : cursoAtual, limite: 60 })}</div>
        </fieldset>
        <h2 style="font-size:16px;margin:0 0 4px">Seus interesses</h2>
        <p class="meta" style="margin:0 0 8px">Escolha de 3 a 5 interesses. Eles ajudam a mostrar com o que você pode colaborar.</p>
        <p class="meta" aria-live="polite" data-cont><b>${sel.length} de 5 selecionadas</b></p>
        ${seletorTags(sel, V.TAGS_MAX)}
        ${editar ? `<h2 class="secao-titulo">Como os outros veem</h2><p class="meta">É isso que o responsável por um projeto vê quando você pede para participar. Seu e-mail não aparece.</p><div data-previa></div>`
                 : `<div class="alerta info">Seu nome, curso e interesses vão aparecer em Conexões › Pessoas para outros estudantes do IFAL. Você pode ocultar em Perfil › Privacidade e dados.</div>`}
        <div class="alerta erro" role="alert" hidden data-erro></div>
        <button class="btn btn-primario btn-bloco" type="submit" data-salvar>${editar ? "Salvar" : "Continuar"}</button>
      </form>`,
      ligar(r) {
        ligarCampos(r);
        const nome = r.querySelector("#nome");
        const radios = r.querySelectorAll("[name=curso]");
        const outro = r.querySelector("[data-outro]");
        const curso = () => (r.querySelector("[name=curso]:checked").value === "si" ? "Sistemas de Informação" : r.querySelector("#outroCurso").value.trim());
        const btn = r.querySelector("[data-salvar]");
        const atualizar = () => {
          r.querySelector("[data-cont]").innerHTML = `<b>${sel.length} de 5 selecionadas</b>`;
          btn.disabled = !(V.nomeValido(nome.value) && curso().length >= 2 && V.tagsPerfilValidas(sel));
          const pv = r.querySelector("[data-previa]");
          if (pv) pv.innerHTML = `<div class="cartao"><div class="linha"><div class="avatar">${esc(iniciais(nome.value))}</div><div><h3 style="margin:0">${esc(nome.value || "Seu nome")}</h3><div class="meta">${esc(curso() || "Curso")}</div></div></div><div class="espaco"></div>${tagsHtml(sel)}</div>`;
        };
        radios.forEach((x) => x.addEventListener("change", () => { outro.hidden = r.querySelector("[name=curso]:checked").value === "si"; atualizar(); }));
        r.querySelector("[data-f]").addEventListener("input", atualizar);
        nome.addEventListener("blur", () => erroCampo(r, "nome", V.nomeValido(nome.value) ? "" : "Informe seu nome (2 a 60 caracteres)."));
        ligarSeletor(r, sel, atualizar, "Você já escolheu 5 interesses. Desmarque um para escolher outro.");
        atualizar();
        r.querySelector("[data-f]").onsubmit = (e) => {
          e.preventDefault();
          const fn = editar ? () => B.atualizarPerfil(nome.value, curso(), sel) : () => B.concluirOnboarding(nome.value, curso(), sel);
          silencioso(acao(btn, fn, r.querySelector("[data-erro]")).then(() => {
            if (editar) { snack("Perfil salvo."); voltar("perfil"); } else ir("permissao");
          }));
        };
      },
    };
  }
  T.onboarding = () => telaPerfilForm("onboarding");

  // ---------------- T07 · Permissão de notificações
  T.permissao = () => ({
    titulo: "Avisos importantes", nav: false,
    html: `<div class="capa" style="padding-top:16px"><div class="logo" aria-hidden="true">${ic("sino")}</div></div>
      <p>Vamos avisar você quando alguém pedir para entrar no seu projeto e quando responderem a um pedido seu. Você pode mudar isso quando quiser.</p>
      <button class="btn btn-primario btn-bloco" data-sim>Permitir notificações</button><div class="espaco"></div>
      <button class="btn btn-texto btn-bloco" data-nao>Agora não</button>`,
    ligar(r) {
      r.querySelector("[data-sim]").onclick = async () => {
        try { if ("Notification" in window) await Notification.requestPermission(); } catch (_) {}
        ir("home");
      };
      r.querySelector("[data-nao]").onclick = () => ir("home");
    },
  });

  // ---------------- T08 · Início (Mural de Oportunidades)
  T.home = () => {
    const lista = B.oportunidades();
    const admin = B.eu.papel === "admin";
    return {
      titulo: "Oportunidades", aba: "home",
      fab: admin ? `<button class="fab" data-fab>${ic("add")} Publicar</button>` : "",
      html: lista.length ? lista.map((o) => `<article class="cartao">
          <div class="opo-img">${o.imagemUrl ? `<img src="${esc(o.imagemUrl)}" alt="" loading="lazy">` : ic("megafone")}</div>
          <h2>${esc(o.titulo)}</h2><p>${esc(o.resumo)}</p>
          <div class="entre"><span class="meta">Publicado em ${data(o.publicadoEm)}</span>
          <a class="btn btn-texto" href="${esc(o.linkExterno)}" target="_blank" rel="noopener" aria-label="Abrir link: ${esc(o.titulo)}">${ic("link")} Abrir link</a></div>
        </article>`).join("") : vazio("megafone", "Ainda não há oportunidades publicadas. Volte em breve."),
      ligar(r, raiz) { const f = raiz.querySelector("[data-fab]"); if (f) f.onclick = () => ir("publicar"); },
    };
  };

  // ---------------- T17 · Publicar oportunidade (admin)
  T.publicar = () => {
    if (B.eu.papel !== "admin") return { titulo: "Publicar oportunidade", voltarPara: "home", nav: false, html: `<div class="alerta erro">Você não tem permissão para fazer isso.</div>` };
    return {
      titulo: "Publicar oportunidade", voltarPara: "home", nav: false,
      html: `<form novalidate data-f>
        ${campo({ id: "titulo", rotulo: "Título", limite: V.TITULO_OPORTUNIDADE_MAX })}
        ${campo({ id: "resumo", rotulo: "Resumo", limite: V.RESUMO_MAX, linhas: 4 })}
        ${campo({ id: "imagem", rotulo: "Endereço da imagem (opcional)", tipo: "url", dica: "https://…" })}
        ${campo({ id: "link", rotulo: "Link da oportunidade (https://…)", tipo: "url", dica: "https://" })}
        <div class="alerta erro" role="alert" hidden data-erro></div>
        <button class="btn btn-primario btn-bloco" type="submit">Publicar</button></form>`,
      ligar(r) {
        ligarCampos(r);
        r.querySelector("[data-f]").onsubmit = (e) => {
          e.preventDefault();
          const t = r.querySelector("#titulo").value, s = r.querySelector("#resumo").value, i = r.querySelector("#imagem").value, l = r.querySelector("#link").value;
          const eT = !t.trim() ? "Informe um título de até 100 caracteres." : "";
          const eS = !s.trim() ? "Informe um resumo de até 300 caracteres." : "";
          const eL = !V.linkValido(l) ? "Informe um link que comece com https://" : "";
          erroCampo(r, "titulo", eT); erroCampo(r, "resumo", eS); erroCampo(r, "link", eL);
          if (eT || eS || eL) return;
          silencioso(acao(e.submitter, () => B.publicar(t, s, i, l), r.querySelector("[data-erro]")).then(() => { snack("Oportunidade publicada."); ir("home"); }));
        };
      },
    };
  };

  // ---------------- T09 · Conexões › Projetos  /  T19 · Conexões › Pessoas
  let limitePessoas = 50;
  T.conexoes = ({ q }) => {
    const seg = q.seg === "pessoas" ? "pessoas" : "projetos";
    const segHtml = `<nav class="segmentado" aria-label="Conexões">
      <a href="#/conexoes" ${seg === "projetos" ? 'aria-current="page"' : ""}>Projetos</a>
      <a href="#/conexoes?seg=pessoas" ${seg === "pessoas" ? 'aria-current="page"' : ""}>Pessoas</a></nav>`;
    const eu = B.eu;

    if (seg === "projetos") {
      const tag = q.tag || "";
      const lista = B.vitrine(tag);
      const chips = `<div class="chips-rolagem" role="group" aria-label="Filtrar por interesse">
        <a class="chip" href="#/conexoes" aria-pressed="${!tag}">Todas</a>
        ${AH.TAGS.slice().sort((a, b) => (eu.tags.includes(a.id) ? 0 : 1) - (eu.tags.includes(b.id) ? 0 : 1)).map((t) => `<a class="chip" href="#/conexoes?tag=${t.id}" aria-pressed="${tag === t.id}">${esc(t.nome)}</a>`).join("")}</div>`;
      const corpo = lista.length
        ? `${tag ? `<p class="meta" aria-live="polite">${lista.length === 1 ? "1 projeto encontrado" : `${lista.length} projetos encontrados`}</p>` : ""}
           ${lista.map((p) => `<a class="cartao clicavel" href="#/projeto/${p.id}" style="text-decoration:none">
             <div class="entre"><h3>${esc(p.titulo)}</h3>${p.donoId === eu.uid ? `<span class="selo claro">Seu projeto</span>` : ""}</div>
             <p class="meta" style="margin:0 0 8px">Criado por ${esc(p.donoNome)} · <b>${vagasTxt(p.vagasDisponiveis)}</b></p>
             ${tagsHtml(p.tagsNecessarias, eu.tags)}</a>`).join("")}`
        : tag ? vazio("pasta", `Nenhum projeto com a tag ${tagNome(tag)}.`, `<a class="btn btn-contorno" href="#/conexoes">Limpar filtro</a>`)
              : vazio("pasta", "Nenhum projeto aberto no momento. Que tal criar o primeiro?");
      return {
        titulo: "Conexões", aba: "conexoes",
        fab: `<button class="fab" data-fab>${ic("add")} Novo projeto</button>`,
        html: segHtml + chips + corpo,
        ligar(r, raiz) { raiz.querySelector("[data-fab]").onclick = () => ir("novo-projeto"); },
      };
    }

    // Pessoas (T19)
    const busca = q.busca || "", tag = q.tag || "";
    return {
      titulo: "Conexões", aba: "conexoes",
      html: segHtml + `<div class="campo" style="margin-bottom:10px"><label for="busca" class="sr-only">Buscar por nome</label>
          <input id="busca" type="search" placeholder="Buscar por nome" value="${esc(busca)}" autocomplete="off"></div>
        <div class="campo"><label for="ftag" class="sr-only">Filtrar por interesse</label><select id="ftag">
          <option value="">Todos os interesses</option>${AH.TAGS.map((t) => `<option value="${t.id}" ${t.id === tag ? "selected" : ""}>${esc(t.nome)}</option>`).join("")}</select></div>
        <div data-lista></div>`,
      ligar(r) {
        const ib = r.querySelector("#busca"), sf = r.querySelector("#ftag"), alvo = r.querySelector("[data-lista]");
        const desenhar = () => {
          const todos = B.diretorio(ib.value, sf.value);
          const lista = todos.slice(0, limitePessoas);
          alvo.innerHTML = todos.length
            ? `<p class="meta" aria-live="polite">${todos.length === 1 ? "1 pessoa encontrada" : `${todos.length} pessoas encontradas`}</p>` +
              lista.map(({ u, emComum }) => `<a class="cartao clicavel" href="#/pessoa/${u.uid}" style="text-decoration:none" aria-label="${esc(u.nome)}, ${esc(u.curso)}, ${emComumTxt(emComum)}">
                <div class="linha" style="flex-wrap:nowrap"><div class="avatar">${esc(iniciais(u.nome))}</div>
                <div style="min-width:0"><h3 style="margin:0">${esc(u.nome)}</h3><div class="meta">${esc(u.curso)}</div>
                <div class="meta" style="color:${emComum ? "var(--tertiary)" : ""};font-weight:${emComum ? 600 : 400}">${emComumTxt(emComum)}</div></div></div>
                <div class="espaco"></div>${tagsHtml(u.tags, eu.tags)}</a>`).join("") +
              (todos.length > lista.length ? `<button class="btn btn-contorno btn-bloco" data-mais>Carregar mais</button>` : "")
            : vazio("pessoas", "Ninguém encontrado com esses filtros.", `<button class="btn btn-contorno" data-limpar>Limpar filtros</button>`);
          const m = alvo.querySelector("[data-mais]"); if (m) m.onclick = () => { limitePessoas += 50; desenhar(); };
          const l = alvo.querySelector("[data-limpar]"); if (l) l.onclick = () => { ib.value = ""; sf.value = ""; sincronizar(); };
        };
        const sincronizar = () => {
          const qs = new URLSearchParams({ seg: "pessoas" });
          if (ib.value) qs.set("busca", ib.value); if (sf.value) qs.set("tag", sf.value);
          history.replaceState(null, "", "#/conexoes?" + qs.toString());
          desenhar();
        };
        ib.addEventListener("input", sincronizar); sf.addEventListener("change", sincronizar);
        desenhar();
      },
    };
  };

  // ---------------- T10 · Detalhe do projeto
  T.projeto = ({ partes }) => {
    const p = B.projeto(partes[1]);
    if (!p) return { titulo: "Projeto", voltarPara: "conexoes", nav: false, html: vazio("pasta", "Não encontramos este item. Atualize a lista.") };
    const eu = B.eu;
    const dono = p.donoId === eu.uid;
    const minha = B.minhaPara(p.id);
    let rodape;
    if (dono) rodape = `<a class="btn btn-tonal btn-bloco" href="#/meus-projetos">Gerenciar em Meus projetos</a>`;
    else if (minha) {
      const txt = minha.status === "Pendente" ? "Solicitação enviada — aguardando resposta" : minha.status === "Aceita" ? "Você participa deste projeto" : "Você já solicitou este projeto";
      rodape = `<div class="alerta ${minha.status === "Aceita" ? "ok" : "info"}">${txt}</div><a class="btn btn-contorno btn-bloco" href="#/minhas">Ver minhas solicitações</a>`;
    } else if (p.visivelNaVitrine) rodape = `<button class="btn btn-primario btn-bloco" data-solicitar>Solicitar participação</button>`;
    else rodape = `<div class="alerta info">Este projeto não está mais recebendo solicitações.</div>`;

    return {
      titulo: "Projeto", voltarPara: "conexoes", nav: false,
      html: `<div class="linha" style="margin-bottom:8px">${statusHtml(p.status, AH.STATUS_PROJETO[p.status])}${dono ? `<span class="selo claro">Seu projeto</span>` : ""}</div>
        <h2 style="font-size:24px;margin:0 0 6px;line-height:1.25">${esc(p.titulo)}</h2>
        <p class="meta">Criado por <a href="#/pessoa/${p.donoId}">${esc(p.donoNome)}</a> · ${data(p.criadoEm)}</p>
        <p style="white-space:pre-line">${esc(p.descricao)}</p>
        <div class="cartao"><div class="entre"><span>Vagas</span><b>${vagasTxt(p.vagasDisponiveis)}</b></div>
          <div class="meta">Aceitos: ${p.aceitos} de ${p.numeroVagas}</div></div>
        <h3 class="secao-titulo">Interesses procurados</h3>${tagsHtml(p.tagsNecessarias, eu.tags)}
        <div class="espaco"></div><div class="espaco"></div>${rodape}`,
      ligar(r) {
        const b = r.querySelector("[data-solicitar]");
        if (b) b.onclick = async () => {
          const ok = await dialogo({ titulo: "Antes de enviar", corpo: `<p>Se sua solicitação for aceita, seu e-mail institucional será compartilhado com o responsável pelo projeto.</p>`, confirmar: "Enviar solicitação" });
          if (!ok) return;
          silencioso(acao(r.querySelector("[data-solicitar]"), () => B.enviarSolicitacao(p.id)).then(() => { snack("Solicitação enviada! Você pode acompanhar em Minhas solicitações."); render(); }));
        };
      },
    };
  };

  // ---------------- T11 · Novo projeto
  T["novo-projeto"] = () => {
    const sel = [];
    let vagas = 2;
    return {
      titulo: "Novo projeto", voltarPara: "conexoes", nav: false,
      html: `<form novalidate data-f>
        ${campo({ id: "titulo", rotulo: "Título", limite: V.TITULO_PROJETO_MAX })}
        ${campo({ id: "descricao", rotulo: "Descrição", limite: V.DESCRICAO_MAX, linhas: 5 })}
        <div class="campo"><span style="display:block;font-size:14px;font-weight:500;margin-bottom:6px">Número de vagas</span>
          <div class="stepper"><button type="button" class="btn btn-contorno" data-menos aria-label="Diminuir vagas">−</button>
          <output aria-live="polite" data-vagas>${vagas} vagas</output>
          <button type="button" class="btn btn-contorno" data-mais aria-label="Aumentar vagas">+</button></div></div>
        <h2 style="font-size:16px;margin:0 0 8px">Interesses procurados (1 a 5)</h2>
        ${seletorTags(sel, V.TAGS_PROJETO_MAX)}
        <div class="alerta erro" role="alert" hidden data-erro></div>
        <button class="btn btn-primario btn-bloco" type="submit">Publicar projeto</button></form>`,
      ligar(r) {
        ligarCampos(r);
        const out = r.querySelector("[data-vagas]");
        const setV = (n) => { vagas = Math.min(V.VAGAS_MAX, Math.max(V.VAGAS_MIN, n)); out.textContent = vagas === 1 ? "1 vaga" : `${vagas} vagas`; };
        r.querySelector("[data-menos]").onclick = () => setV(vagas - 1);
        r.querySelector("[data-mais]").onclick = () => setV(vagas + 1);
        ligarSeletor(r, sel, () => {}, "Escolha pelo menos 1 interesse (máximo 5).");
        r.querySelector("[data-f]").onsubmit = (e) => {
          e.preventDefault();
          const t = r.querySelector("#titulo").value, d = r.querySelector("#descricao").value;
          const eT = V.tituloProjetoValido(t) ? "" : "O título precisa ter de 5 a 80 caracteres.";
          const eD = V.descricaoValida(d) ? "" : "A descrição precisa ter de 20 a 1000 caracteres.";
          erroCampo(r, "titulo", eT); erroCampo(r, "descricao", eD);
          const eTg = V.tagsProjetoValidas(sel) ? "" : "Escolha pelo menos 1 interesse (máximo 5).";
          const er = r.querySelector("[data-erro]");
          er.textContent = eTg; er.hidden = !eTg;
          if (eT || eD || eTg) return;
          silencioso(acao(e.submitter, () => B.criarProjeto(t, d, vagas, sel.slice()), er).then((id) => { snack("Projeto publicado!"); trocar("projeto/" + id); }));
        };
      },
    };
  };

  // ---------------- T12 · Perfil
  T.perfil = () => {
    const eu = B.eu;
    const pend = B.recebidas(eu.uid).filter((s) => s.status === "Pendente").length;
    const tema = temaSalvo();
    const notif = "Notification" in window && Notification.permission === "granted";
    return {
      titulo: "Perfil", aba: "perfil",
      html: `<div class="cartao"><div class="linha" style="flex-wrap:nowrap"><div class="avatar grande">${esc(iniciais(eu.nome))}</div>
          <div><div class="linha"><h2 style="margin:0;font-size:22px">${esc(eu.nome)}</h2>${eu.papel === "admin" ? `<span class="selo">Admin</span>` : ""}</div>
          <div class="meta">${esc(eu.curso)}</div><div class="meta">${esc(B.email)}</div></div></div>
          <div class="espaco"></div>${tagsHtml(eu.tags)}</div>
        <nav class="menu">
          <a href="#/editar-perfil">${ic("editar")}<span class="rot">Editar perfil</span>${ic("seta")}</a>
          <a href="#/recebidas">${ic("inbox")}<span class="rot">Solicitações recebidas</span>${pend ? `<span class="dir">${pend} pendentes</span>` : ""}${ic("seta")}</a>
          <a href="#/minhas">${ic("enviar")}<span class="rot">Minhas solicitações</span>${ic("seta")}</a>
          <a href="#/meus-projetos">${ic("pasta")}<span class="rot">Meus projetos</span>${ic("seta")}</a>
        </nav>
        <div class="menu"><div style="padding:14px 16px"><div class="linha" style="flex-wrap:nowrap">${ic("sino")}<div style="flex:1"><b>Notificações</b>
          <div class="meta">${notif ? "Notificações ativadas" : "Notificações desativadas. Você ainda vê tudo no app, mas não será avisado."}</div></div>
          ${notif ? "" : `<button class="btn btn-texto" data-ativar>Ativar</button>`}</div></div></div>
        <div class="menu"><fieldset style="border:0;margin:0;padding:14px 16px"><legend class="sr-only">Aparência</legend>
          <div class="linha" style="margin-bottom:4px">${ic("paleta")}<b>Aparência</b></div>
          ${[["sistema", "Seguir o sistema"], ["claro", "Claro"], ["escuro", "Escuro"]].map(([v, l]) => `<label class="radio"><input type="radio" name="tema" value="${v}" ${tema === v ? "checked" : ""}> ${l}</label>`).join("")}
        </fieldset></div>
        <nav class="menu">
          <a href="#/privacidade">${ic("escudo")}<span class="rot">Privacidade e dados</span>${ic("seta")}</a>
          <button class="item" data-restaurar>${ic("restaurar")}<span class="rot">Restaurar dados de exemplo</span></button>
          <button class="item" data-sair>${ic("sair")}<span class="rot">Sair</span></button>
        </nav>
        <p class="meta" style="text-align:center">ÁgoraHub Web · protótipo · Versão 1.0.0</p>`,
      ligar(r) {
        r.querySelectorAll("[name=tema]").forEach((x) => (x.onchange = () => aplicarTema(x.value)));
        const a = r.querySelector("[data-ativar]");
        if (a) a.onclick = async () => {
          if (!("Notification" in window)) { snack("Este navegador não tem notificações."); return; }
          await Notification.requestPermission(); render();
        };
        r.querySelector("[data-sair]").onclick = () => { B.sair(); ir("abertura"); };
        r.querySelector("[data-restaurar]").onclick = async () => {
          const ok = await dialogo({ titulo: "Restaurar dados?", corpo: "<p>Todos os dados voltam ao exemplo inicial e você sai da conta.</p>", confirmar: "Restaurar", destrutivo: true });
          if (ok) { B.restaurar(); snack("Dados de exemplo restaurados."); ir("abertura"); }
        };
      },
    };
  };
  T["editar-perfil"] = () => telaPerfilForm("editar");

  // ---------------- T14 · Solicitações recebidas
  T.recebidas = ({ q }) => {
    const eu = B.eu;
    const abas = ["Pendente", "Aceita", "Recusada", "Removida"];
    const rotAbas = ["Pendentes", "Aceitas", "Recusadas", "Removidas"];
    const aba = Math.min(3, Math.max(0, Number(q.aba) || 0));
    const projetoFiltro = q.projeto || "";
    const todas = B.recebidas(eu.uid).filter((s) => !projetoFiltro || s.projetoId === projetoFiltro);
    const conta = abas.map((st) => todas.filter((s) => s.status === st).length);
    const lista = todas.filter((s) => s.status === abas[aba]);
    const qp = projetoFiltro ? `&projeto=${projetoFiltro}` : "";
    const pf = projetoFiltro && B.projeto(projetoFiltro);

    const cartao = (s) => {
      const motivo = s.motivo ? AH.MOTIVOS[s.motivo].rotulo + (s.motivoTexto ? ` — ${s.motivoTexto}` : "") : "";
      let acoes = "";
      if (s.status === "Pendente") acoes = `<div class="linha" style="justify-content:flex-end"><button class="btn btn-contorno" data-recusar="${s.id}" aria-label="Recusar ${esc(s.nomeSolicitante)}">Recusar</button><button class="btn btn-primario" data-aceitar="${s.id}" aria-label="Aceitar ${esc(s.nomeSolicitante)}">Aceitar</button></div>`;
      if (s.status === "Aceita") acoes = `<div class="alerta ok" style="margin:8px 0">${ic("email").replace("<svg", '<svg style="width:16px;height:16px;vertical-align:-3px"')} <b>${esc(s.emailLiberado)}</b></div>
        <div class="linha"><button class="btn btn-texto" data-copiar="${esc(s.emailLiberado)}">${ic("copiar").replace("<svg", '<svg style="width:18px;height:18px"')} Copiar e-mail</button>
        <a class="btn btn-texto" href="mailto:${esc(s.emailLiberado)}?subject=${encodeURIComponent("ÁgoraHub — " + s.tituloProjeto)}">Enviar e-mail</a>
        <button class="btn btn-texto btn-perigo" data-remover="${s.id}" aria-label="Remover ${esc(s.nomeSolicitante)}">Remover</button></div>`;
      return `<article class="cartao">
        <div class="entre"><h3 style="margin:0">${esc(s.nomeSolicitante)}</h3><a class="btn btn-texto" href="#/pessoa/${s.solicitanteId}" aria-label="Ver perfil de ${esc(s.nomeSolicitante)}">Ver perfil</a></div>
        <p class="meta" style="margin:0 0 8px">Projeto: ${esc(s.tituloProjeto)} · Enviada em ${data(s.criadaEm)}</p>
        ${tagsHtml(s.tagsSolicitante)}
        ${motivo ? `<p class="meta" style="margin:10px 0 0">Motivo: ${esc(motivo)}</p>` : ""}
        ${acoes ? `<div class="espaco"></div>${acoes}` : ""}</article>`;
    };

    return {
      titulo: "Solicitações recebidas", voltarPara: "perfil", nav: false,
      html: `<nav class="abas" aria-label="Status">${rotAbas.map((r, i) => `<a href="#/recebidas?aba=${i}${qp}" ${i === aba ? 'aria-current="page"' : ""} aria-label="${r}, ${conta[i]} itens">${r} (${conta[i]})</a>`).join("")}</nav>
        ${pf ? `<div class="alerta info entre"><span>Projeto: ${esc(pf.titulo)}</span><a href="#/recebidas?aba=${aba}">Limpar filtro</a></div>` : ""}
        ${lista.length ? lista.map(cartao).join("") : vazio("inbox", "Nenhuma solicitação por aqui.")}`,
      ligar(r) {
        r.querySelectorAll("[data-aceitar]").forEach((b) => (b.onclick = () => silencioso(acao(b, () => B.aceitar(b.dataset.aceitar)).then((res) => {
          snack(res.fechou ? "Vagas preenchidas: o projeto foi fechado e as demais solicitações foram recusadas automaticamente." : "Solicitação aceita. O e-mail está na aba Aceitas.");
          render();
        }))));
        r.querySelectorAll("[data-recusar]").forEach((b) => (b.onclick = async () => {
          const motivos = Object.entries(AH.MOTIVOS).filter(([, m]) => m.manual);
          const res = await dialogo({
            titulo: "Motivo da recusa", confirmar: "Recusar", destrutivo: true,
            corpo: motivos.map(([k, m]) => `<label class="radio"><input type="radio" name="motivo" value="${k}"> ${m.rotulo}</label>`).join("") +
              `<div class="campo" style="margin-top:8px"><label for="txt">Explique, se quiser (opcional)</label><textarea id="txt" name="texto" maxlength="200" rows="2"></textarea></div>`,
            validar: (fd) => !!fd.get("motivo"),
          });
          if (!res) return;
          silencioso(acao(b, () => B.recusar(b.dataset.recusar, res.motivo, res.texto)).then(() => { snack("Solicitação recusada."); render(); }));
        }));
        r.querySelectorAll("[data-remover]").forEach((b) => (b.onclick = async () => {
          const s = B.recebidas(eu.uid).find((x) => x.id === b.dataset.remover);
          const res = await dialogo({
            titulo: "Remover participante", confirmar: "Remover", destrutivo: true,
            corpo: `<p>${esc(s.nomeSolicitante)} deixará de participar e a vaga será liberada.</p><div class="campo"><label for="txt">Motivo (opcional)</label><textarea id="txt" name="texto" maxlength="200" rows="2"></textarea></div>`,
          });
          if (!res) return;
          silencioso(acao(b, () => B.remover(s.id, res.texto)).then(() => { snack("Vaga liberada. Para voltar a receber solicitações, reabra o projeto em Meus projetos."); render(); }));
        }));
        r.querySelectorAll("[data-copiar]").forEach((b) => (b.onclick = async () => {
          try { await navigator.clipboard.writeText(b.dataset.copiar); } catch (_) {}
          snack("E-mail copiado.");
        }));
      },
    };
  };

  // ---------------- T15 · Minhas solicitações
  T.minhas = () => {
    const lista = B.minhas(B.eu.uid);
    return {
      titulo: "Minhas solicitações", voltarPara: "perfil", nav: false,
      html: lista.length ? lista.map((s) => {
        const motivo = s.motivo ? AH.MOTIVOS[s.motivo].rotulo + (s.motivoTexto ? ` — ${s.motivoTexto}` : "") : "";
        return `<article class="cartao"><div class="entre" style="align-items:flex-start"><h3>${esc(s.tituloProjeto)}</h3>${statusHtml(s.status, AH.STATUS_SOL[s.status])}</div>
          <p class="meta" style="margin:0">Enviada em ${data(s.criadaEm)}</p>
          ${s.status === "Aceita" ? `<div class="alerta ok" style="margin:10px 0 0">O responsável recebeu seu e-mail institucional e deve entrar em contato.</div>` : ""}
          ${motivo ? `<p class="meta" style="margin:8px 0 0">Motivo: ${esc(motivo)}</p>` : ""}
          ${B.projeto(s.projetoId) ? `<a class="btn btn-texto" style="margin-top:6px;padding:0" href="#/projeto/${s.projetoId}">Ver projeto</a>` : ""}</article>`;
      }).join("") : vazio("enviar", "Você ainda não pediu para participar de nenhum projeto.", `<a class="btn btn-contorno" href="#/conexoes">Ver projetos</a>`),
    };
  };

  // ---------------- T16 · Meus projetos
  T["meus-projetos"] = () => {
    const eu = B.eu;
    const lista = B.meusProjetos(eu.uid);
    const rec = B.recebidas(eu.uid);
    return {
      titulo: "Meus projetos", voltarPara: "perfil", nav: false,
      html: `<a class="btn btn-tonal btn-bloco" href="#/novo-projeto">${ic("add").replace("<svg", '<svg style="width:20px;height:20px"')} Criar projeto</a><div class="espaco"></div>` +
        (lista.length ? lista.map((p) => {
          const pend = rec.filter((s) => s.projetoId === p.id && s.status === "Pendente").length;
          const podeExcluir = !B.temSolicitacoes(p.id);
          return `<article class="cartao">
            <div class="linha" style="margin-bottom:6px">${statusHtml(p.status, AH.STATUS_PROJETO[p.status])}${p.status === "Aberto" && !p.visivelNaVitrine ? `<span class="meta">fora da vitrine</span>` : ""}</div>
            <a href="#/projeto/${p.id}" style="color:inherit;text-decoration:none"><h3>${esc(p.titulo)}</h3></a>
            <p class="meta" style="margin:0">Aceitos: ${p.aceitos} de ${p.numeroVagas}${pend ? ` · <b>${pend} pendentes</b>` : ""}</p>
            <div class="linha" style="margin-top:8px">
              <a class="btn btn-texto" style="padding:0 8px" href="#/recebidas?aba=0&projeto=${p.id}">Ver solicitações</a>
              ${p.status === "Encerrado" || p.status === "Fechado" ? `<button class="btn btn-texto" data-reabrir="${p.id}">Reabrir</button>` : ""}
              ${p.status !== "Encerrado" ? `<button class="btn btn-texto" data-encerrar="${p.id}">Encerrar</button>` : ""}
              ${podeExcluir ? `<button class="btn btn-texto btn-perigo" data-excluir="${p.id}">Excluir</button>` : ""}
            </div></article>`;
        }).join("") : vazio("pasta", "Você ainda não criou projetos.")),
      ligar(r) {
        r.querySelectorAll("[data-encerrar]").forEach((b) => (b.onclick = async () => {
          if (!(await dialogo({ titulo: "Encerrar", corpo: "<p>Encerrar este projeto? As solicitações pendentes serão recusadas com o motivo “Projeto encerrado pelo responsável”.</p>", confirmar: "Encerrar", destrutivo: true }))) return;
          silencioso(acao(b, () => B.encerrar(b.dataset.encerrar)).then(() => { snack("Projeto encerrado."); render(); }));
        }));
        r.querySelectorAll("[data-reabrir]").forEach((b) => (b.onclick = async () => {
          if (!(await dialogo({ titulo: "Reabrir", corpo: "<p>Reabrir este projeto? Ele volta a receber solicitações se houver vaga.</p>", confirmar: "Reabrir" }))) return;
          silencioso(acao(b, () => B.reabrir(b.dataset.reabrir)).then((vis) => {
            snack(vis ? "Projeto reaberto." : "O projeto foi reaberto, mas não tem vagas livres. Ele só aparece na vitrine quando uma vaga for liberada.");
            render();
          }));
        }));
        r.querySelectorAll("[data-excluir]").forEach((b) => (b.onclick = async () => {
          if (!(await dialogo({ titulo: "Excluir", corpo: "<p>Excluir este projeto? Essa ação não pode ser desfeita.</p>", confirmar: "Excluir", destrutivo: true }))) return;
          silencioso(acao(b, () => B.excluir(b.dataset.excluir)).then(() => { snack("Projeto excluído."); render(); }));
        }));
      },
    };
  };

  // ---------------- T18 · Privacidade e dados
  T.privacidade = () => {
    const eu = B.estadoSessao() === "VERIFICADO" ? B.eu : null;
    return {
      titulo: "Privacidade e dados", voltarPara: eu ? "perfil" : "abertura", nav: false,
      html: `<p>O ÁgoraHub é um projeto acadêmico de estudantes de Sistemas de Informação do IFAL Arapiraca. Usamos seu e-mail institucional para você entrar no app e, somente se você pedir para participar de um projeto e for aceito, para que o responsável pelo projeto entre em contato com você. Seu nome, curso e interesses ficam visíveis para outros estudantes do IFAL que usam o app. Não vendemos nem compartilhamos seus dados com terceiros. Os dados ficam armazenados no Google Firebase.</p>
        ${eu && eu.onboardingConcluido ? `<div class="cartao"><label class="interruptor"><input type="checkbox" data-vis ${eu.visivelNoDiretorio ? "checked" : ""}><b>Mostrar meu perfil em Pessoas</b></label>
          <p class="meta" style="margin:8px 0 0">Desligado, você some da lista de Pessoas. Quem já tem vínculo com você (solicitações e projetos) continua vendo seu nome.</p></div>` : ""}
        <h2 class="secao-titulo">Quem vê cada dado</h2>
        <ul style="padding-left:20px;margin:0"><li>E-mail: só você; o responsável por um projeto só depois de aceitar você.</li>
        <li>Nome, curso e interesses: estudantes do IFAL no app, inclusive em Conexões › Pessoas (se você não ocultar).</li>
        <li>Suas solicitações: só você e o responsável pelo projeto.</li></ul>
        <h2 class="secao-titulo">Corrigir ou excluir seus dados</h2>
        <p>Para corrigir, use Editar perfil. Para pedir a exclusão da sua conta, fale com a equipe do ÁgoraHub.</p>
        <div class="alerta aviso">Nesta demonstração web os dados ficam apenas no seu navegador.</div>`,
      ligar(r) {
        const v = r.querySelector("[data-vis]");
        if (v) v.onchange = () => silencioso(acao(null, () => B.definirVisibilidade(v.checked)).then(() => snack(v.checked ? "Seu perfil aparece em Pessoas." : "Seu perfil foi ocultado de Pessoas.")));
      },
    };
  };

  // ---------------- T20 · Perfil do estudante
  T.pessoa = ({ partes }) => {
    const uid = partes[1];
    const u = B.usuario(uid);
    const eu = B.eu;
    if (uid === eu.uid) { setTimeout(() => trocar("perfil")); return { titulo: "", html: "" }; }
    const pode = u && u.onboardingConcluido && (u.visivelNoDiretorio || B.temVinculo(uid));
    if (!pode) return { titulo: "Perfil do estudante", voltarPara: "conexoes?seg=pessoas", nav: false, html: vazio("perfil", "Não encontramos este item. Atualize a lista.") };
    const comum = u.tags.filter((t) => eu.tags.includes(t)).length;
    const projetos = B.abertosDe(uid).filter((p) => p.visivelNaVitrine);
    return {
      titulo: "Perfil do estudante", voltarPara: "conexoes?seg=pessoas", nav: false,
      html: `<div style="text-align:center;padding:12px 0 8px"><div class="avatar grande" style="margin:0 auto 10px">${esc(iniciais(u.nome))}</div>
          <h2 style="margin:0;font-size:24px">${esc(u.nome)}</h2><div class="meta">${esc(u.curso)}</div></div>
        <h3 class="secao-titulo">Interesses</h3>
        <p class="meta" style="color:${comum ? "var(--tertiary)" : ""};font-weight:600;margin:0 0 8px">${emComumTxt(comum)}</p>
        ${tagsHtml(u.tags, eu.tags)}
        <h3 class="secao-titulo">Projetos abertos</h3>
        ${projetos.length ? projetos.map((p) => `<a class="cartao clicavel" href="#/projeto/${p.id}" style="text-decoration:none"><h3>${esc(p.titulo)}</h3><p class="meta" style="margin:0 0 8px">${vagasTxt(p.vagasDisponiveis)}</p>${tagsHtml(p.tagsNecessarias, eu.tags)}</a>`).join("")
          : `<p class="meta">Nenhum projeto aberto no momento.</p>`}
        <div class="alerta info" style="margin-top:16px">O e-mail só é liberado quando um responsável aceita uma solicitação.</div>`,
    };
  };

  // ================================================================ Guarda de rotas e montagem
  const PUBLICAS = ["abertura", "login", "cadastro", "recuperar", "privacidade"];
  function guarda(nome) {
    const estado = B.estadoSessao();
    if (estado === "SEM_SESSAO") return PUBLICAS.includes(nome) ? null : "abertura";
    if (estado === "NAO_VERIFICADO") return nome === "verificacao" || nome === "privacidade" ? null : "verificacao";
    const eu = B.eu;
    if (!eu || !eu.onboardingConcluido) return nome === "onboarding" || nome === "privacidade" ? null : "onboarding";
    if (["", "abertura", "login", "cadastro", "verificacao", "onboarding", "recuperar"].includes(nome)) return "home";
    if (!T[nome]) return "home";
    return null;
  }

  function render() {
    const rota = rotaAtual();
    const destino = guarda(rota.nome);
    if (destino) { trocar(destino); return; }

    const tela = T[rota.nome](rota);
    const app = document.getElementById("app");
    const eu = B.estadoSessao() === "VERIFICADO" ? B.eu : null;
    const pend = eu && eu.onboardingConcluido ? B.recebidas(eu.uid).filter((s) => s.status === "Pendente").length : 0;
    const comNav = tela.nav !== false;

    const topo = tela.semTopo ? "" : `<header class="topo ${tela.voltarPara ? "com-voltar" : ""}">
      ${tela.voltarPara ? `<button class="icone-btn" data-voltar aria-label="Voltar">${ic("voltar")}</button>` : ""}
      <h1 tabindex="-1">${esc(tela.titulo)}</h1></header>`;
    const nav = comNav ? `<nav class="nav" aria-label="Navegação principal">
      ${[["home", "Início", "home"], ["conexoes", "Conexões", "pessoas"], ["perfil", "Perfil", "perfil"]].map(([r, l, i]) => `<a href="#/${r}" ${tela.aba === r ? 'aria-current="page"' : ""}>
        <span class="pilula">${ic(i)}</span>${l}${r === "perfil" && pend ? `<span class="badge" aria-label="${pend} pendentes">${pend}</span>` : ""}</a>`).join("")}</nav>` : "";

    app.innerHTML = `<div class="selo-demo">Modo demonstração</div>${topo}
      <main class="conteudo ${comNav ? "" : "sem-nav"}" id="conteudo">${tela.html}</main>${tela.fab || ""}${nav}`;
    const main = app.querySelector("#conteudo");
    const vb = app.querySelector("[data-voltar]");
    if (vb) vb.onclick = () => voltar(tela.voltarPara);
    if (tela.ligar) tela.ligar(main, app);
    document.title = (tela.titulo ? tela.titulo + " · " : "") + "ÁgoraHub";
    atualizarLateral();
    if (AH.editor) AH.editor.aposRender(app);
  }
  AH.render = render;

  // ================================================================ Painel lateral (apresentação)
  function atualizarLateral() {
    const el = document.getElementById("contas");
    if (!el) return;
    const atual = B.uid;
    const contas = ["demo", "marina", "pedro", "camila", "isabela", "theo", "bianca", "rafael"];
    el.innerHTML = contas.map((c) => {
      const email = `${c}@aluno.ifal.edu.br`;
      const uid = "u-" + c;
      return `<button data-entrar="${email}" aria-current="${atual === uid}">${c}@</button>`;
    }).join("");
    el.querySelectorAll("[data-entrar]").forEach((b) => (b.onclick = async () => {
      try { B.sair(); await B.entrar(b.dataset.entrar, AH.SENHA_PADRAO); ir("home"); render(); snack("Entrou como " + b.dataset.entrar); }
      catch (e) { snack(e.message + " (restaure os dados de exemplo)"); }
    }));
  }
  const rest = document.getElementById("restaurar");
  if (rest) rest.onclick = () => { B.restaurar(); ir("abertura"); render(); snack("Dados de exemplo restaurados."); };

  render();
})();
