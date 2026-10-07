/*
 * ÁgoraHub Web — "Firebase simulado".
 * Porta para JavaScript do RepositoriosDemo.kt: as MESMAS regras das regras de segurança
 * e das Cloud Functions (vagas, fechamento automático, recusa automática, remoção,
 * encerrar/reabrir, exclusão só sem histórico, publicação só por admin).
 * Os dados ficam no navegador (localStorage) e podem ser restaurados a qualquer momento.
 */
(function () {
  const CHAVE = "agorahub-web-demo-v1";

  // ---------------------------------------------------------------- Validações (Guia, seção 6)
  const V = {
    DOMINIO: "@aluno.ifal.edu.br",
    SENHA_MIN: 8, TAGS_MIN: 3, TAGS_MAX: 5, NOME_MIN: 2, NOME_MAX: 60,
    TITULO_PROJETO_MIN: 5, TITULO_PROJETO_MAX: 80, DESCRICAO_MIN: 20, DESCRICAO_MAX: 1000,
    VAGAS_MIN: 1, VAGAS_MAX: 20, TAGS_PROJETO_MAX: 5, MOTIVO_TEXTO_MAX: 200,
    TITULO_OPORTUNIDADE_MAX: 100, RESUMO_MAX: 300,
    normalizarEmail: (e) => String(e || "").trim().toLowerCase(),
    emailInstitucional(e) {
      const x = V.normalizarEmail(e);
      return x.endsWith(V.DOMINIO) && x.length > V.DOMINIO.length && !x.includes(" ");
    },
    senhaValida: (s) => String(s || "").length >= V.SENHA_MIN,
    nomeValido: (n) => { const l = String(n || "").trim().length; return l >= V.NOME_MIN && l <= V.NOME_MAX; },
    tagsPerfilValidas: (t) => t.length >= V.TAGS_MIN && t.length <= V.TAGS_MAX,
    tituloProjetoValido: (t) => { const l = String(t || "").trim().length; return l >= V.TITULO_PROJETO_MIN && l <= V.TITULO_PROJETO_MAX; },
    descricaoValida: (d) => { const l = String(d || "").trim().length; return l >= V.DESCRICAO_MIN && l <= V.DESCRICAO_MAX; },
    vagasValidas: (v) => Number.isInteger(v) && v >= V.VAGAS_MIN && v <= V.VAGAS_MAX,
    tagsProjetoValidas: (t) => t.length >= 1 && t.length <= V.TAGS_PROJETO_MAX,
    linkValido(l) { const x = String(l || "").trim(); return x.startsWith("https://") && x.length > 8 && !x.includes(" "); },
  };
  AH.V = V;

  class ErroApp extends Error {}
  AH.ErroApp = ErroApp;
  const E = {
    permissao: "Você não tem permissão para fazer isso.",
    sessao: "Sua sessão expirou. Entre novamente.",
    naoEncontrado: "Não encontramos este item. Atualize a lista.",
    precondicao: "Esta ação não é mais possível. A lista foi atualizada.",
    argumento: "Verifique as informações e tente de novo.",
    dominio: "Use seu e-mail institucional (@aluno.ifal.edu.br).",
    login: "E-mail ou senha incorretos. Confira e tente de novo.",
    emailEmUso: "Já existe uma conta com este e-mail. Entre ou recupere sua senha.",
    senhaCurta: "A senha precisa ter pelo menos 8 caracteres.",
    duplicada: "Você já enviou uma solicitação para este projeto.",
    indisponivel: "Este projeto não está mais recebendo solicitações.",
  };
  AH.ERROS = E;
  const falhar = (m) => { throw new ErroApp(m); };

  // ---------------------------------------------------------------- Persistência
  let db;
  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) { db = JSON.parse(bruto); return; }
    } catch (_) { /* navegador sem armazenamento: segue em memória */ }
    db = AH.bancoInicial();
  }
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch (_) { /* ignora */ }
    ouvintes.forEach((f) => f());
  }
  const ouvintes = [];
  carregar();

  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  /** Simula a ida ao servidor: pequena espera + execução atômica. */
  async function transacao(fn) {
    await espera(250);
    const r = fn();
    salvar();
    return r;
  }
  const novoId = () => Math.random().toString(36).slice(2, 10);
  const agora = () => Date.now();
  const uidAtual = () => db.sessao || falhar(E.sessao);
  const visivel = (status, vagas) => status === "Aberto" && vagas > 0;
  const emailDe = (uid) => (db.contas.find((c) => c.uid === uid) || {}).email || null;

  function recusarPendentes(projetoId, motivo, exceto) {
    let n = 0;
    Object.values(db.solicitacoes).forEach((s) => {
      if (s.projetoId === projetoId && s.status === "Pendente" && s.id !== exceto) {
        s.status = "Recusada"; s.motivo = motivo; s.motivoTexto = ""; s.atualizadaEm = agora(); n++;
      }
    });
    return n;
  }
  function projetoDoDono(id) {
    const p = db.projetos[id] || falhar(E.naoEncontrado);
    if (p.donoId !== uidAtual()) falhar(E.permissao);
    return p;
  }
  function solicitacaoDoDono(id, esperado) {
    const s = db.solicitacoes[id] || falhar(E.naoEncontrado);
    if (s.donoId !== uidAtual()) falhar(E.permissao);
    if (s.status !== esperado) falhar(E.precondicao);
    return s;
  }

  AH.banco = {
    aoMudar: (f) => ouvintes.push(f),
    restaurar() { db = AH.bancoInicial(); salvar(); },
    get uid() { return db.sessao; },
    get email() { return db.sessao ? emailDe(db.sessao) : null; },
    emailDe,

    // ------------------------------------------------ Auth (F01, F05, ADR-005)
    estadoSessao() {
      if (!db.sessao) return "SEM_SESSAO";
      const c = db.contas.find((x) => x.uid === db.sessao);
      if (!c) return "SEM_SESSAO";
      return c.verificado ? "VERIFICADO" : "NAO_VERIFICADO";
    },
    async entrar(email, senha) {
      const e = V.normalizarEmail(email);
      if (!V.emailInstitucional(e)) falhar(E.dominio);
      const c = await transacao(() => db.contas.find((x) => x.email === e && x.senha === senha));
      if (!c) falhar(E.login); // mensagem genérica (CT03)
      db.sessao = c.uid; salvar();
    },
    async criarConta(email, senha) {
      const e = V.normalizarEmail(email);
      if (!V.emailInstitucional(e)) falhar(E.dominio);
      if (!V.senhaValida(senha)) falhar(E.senhaCurta);
      await transacao(() => {
        if (db.contas.some((x) => x.email === e)) falhar(E.emailEmUso);
        const c = { uid: "u-" + novoId(), email: e, senha, verificado: false };
        db.contas.push(c); db.sessao = c.uid;
      });
    },
    async verificarEmail() {
      return transacao(() => {
        const c = db.contas.find((x) => x.uid === db.sessao);
        if (c) c.verificado = true;
        return !!c;
      });
    },
    async enviarRedefinicao(email) {
      if (!V.emailInstitucional(email)) falhar(E.dominio);
      await transacao(() => {});
    },
    sair() { db.sessao = null; salvar(); },

    // ------------------------------------------------ Usuários (F02, F03, F23–F25)
    usuario: (uid) => db.usuarios[uid] || null,
    get eu() { return db.sessao ? db.usuarios[db.sessao] || null : null; },
    async concluirOnboarding(nome, curso, tags) {
      if (!V.tagsPerfilValidas(tags) || !V.nomeValido(nome)) falhar(E.argumento);
      await transacao(() => {
        const uid = uidAtual();
        db.usuarios[uid] = { uid, nome: nome.trim(), curso: curso.trim(), tags, papel: "estudante", onboardingConcluido: true, visivelNoDiretorio: true };
      });
    },
    async atualizarPerfil(nome, curso, tags) {
      if (!V.tagsPerfilValidas(tags) || !V.nomeValido(nome)) falhar(E.argumento);
      await transacao(() => {
        const u = db.usuarios[uidAtual()] || falhar(E.naoEncontrado);
        u.nome = nome.trim(); u.curso = curso.trim(); u.tags = tags;
      });
    },
    async definirVisibilidade(vis) {
      await transacao(() => {
        const u = db.usuarios[uidAtual()] || falhar(E.naoEncontrado);
        u.visivelNoDiretorio = !!vis;
      });
    },
    /** T19 · Pessoas (RN21): visíveis, com onboarding, exceto eu; em comum ↓, depois nome. */
    diretorio(busca, tagId) {
      const eu = this.eu;
      const minhas = eu ? eu.tags : [];
      const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      const f = norm(busca || "").trim();
      return Object.values(db.usuarios)
        .filter((u) => u.uid !== db.sessao && u.onboardingConcluido && u.visivelNoDiretorio)
        .filter((u) => !tagId || u.tags.includes(tagId))
        .filter((u) => !f || norm(u.nome).includes(f))
        .map((u) => ({ u, emComum: u.tags.filter((t) => minhas.includes(t)).length }))
        .sort((a, b) => b.emComum - a.emComum || norm(a.u.nome).localeCompare(norm(b.u.nome)));
    },
    /** RN23: oculto continua visível para quem tem vínculo (solicitação entre os dois). */
    temVinculo(outro) {
      const eu = db.sessao;
      return Object.values(db.solicitacoes).some((s) =>
        (s.solicitanteId === eu && s.donoId === outro) || (s.solicitanteId === outro && s.donoId === eu));
    },

    // ------------------------------------------------ Oportunidades (F06, F07)
    oportunidades: () => db.oportunidades.slice().sort((a, b) => b.publicadoEm - a.publicadoEm),
    async publicar(titulo, resumo, imagemUrl, link) {
      await transacao(() => {
        const u = db.usuarios[uidAtual()];
        if (!u || u.papel !== "admin") falhar(E.permissao); // RN05 / CT11
        db.oportunidades.push({ id: "o-" + novoId(), titulo: titulo.trim(), resumo: resumo.trim(), imagemUrl: (imagemUrl || "").trim() || null, linkExterno: link.trim(), publicadoEm: agora() });
      });
    },

    // ------------------------------------------------ Projetos (F08, F09, F15)
    projeto: (id) => db.projetos[id] || null,
    vitrine(tagId) {
      return Object.values(db.projetos)
        .filter((p) => p.visivelNaVitrine && (!tagId || p.tagsNecessarias.includes(tagId))) // RN07
        .sort((a, b) => b.criadoEm - a.criadoEm);
    },
    meusProjetos(uid) {
      return Object.values(db.projetos).filter((p) => p.donoId === uid).sort((a, b) => b.criadoEm - a.criadoEm);
    },
    abertosDe(uid) { return this.meusProjetos(uid).filter((p) => p.status === "Aberto"); },
    async criarProjeto(titulo, descricao, vagas, tags) {
      if (!V.tituloProjetoValido(titulo) || !V.descricaoValida(descricao) || !V.vagasValidas(vagas) || !V.tagsProjetoValidas(tags)) falhar(E.argumento);
      return transacao(() => {
        const uid = uidAtual();
        const id = "p-" + novoId();
        db.projetos[id] = { id, donoId: uid, donoNome: db.usuarios[uid].nome, titulo: titulo.trim(), descricao: descricao.trim(), numeroVagas: vagas, aceitos: 0, vagasDisponiveis: vagas, tagsNecessarias: tags, status: "Aberto", visivelNaVitrine: true, criadoEm: agora() };
        return id;
      });
    },
    /** RN14: encerra e recusa as pendentes com "Projeto encerrado pelo responsável". */
    async encerrar(id) {
      return transacao(() => {
        const p = projetoDoDono(id);
        if (p.status === "Encerrado") falhar(E.precondicao);
        p.status = "Encerrado"; p.visivelNaVitrine = false;
        return recusarPendentes(p.id, "PROJETO_ENCERRADO");
      });
    },
    /** RN14 + RN07: reabre; só volta à vitrine se houver vaga (CT25). */
    async reabrir(id) {
      return transacao(() => {
        const p = projetoDoDono(id);
        if (p.status === "Aberto") falhar(E.precondicao);
        p.status = "Aberto"; p.visivelNaVitrine = visivel("Aberto", p.vagasDisponiveis);
        return p.visivelNaVitrine;
      });
    },
    /** RN15: só exclui se nunca houve solicitação. */
    async excluir(id) {
      await transacao(() => {
        const p = projetoDoDono(id);
        if (Object.values(db.solicitacoes).some((s) => s.projetoId === p.id)) falhar(E.precondicao);
        delete db.projetos[p.id];
      });
    },
    temSolicitacoes: (projetoId) => Object.values(db.solicitacoes).some((s) => s.projetoId === projetoId),

    // ------------------------------------------------ Solicitações (F10–F16)
    minhaPara(projetoId) { return db.solicitacoes[projetoId + "_" + db.sessao] || null; },
    async enviarSolicitacao(projetoId) {
      await transacao(() => {
        const uid = uidAtual();
        const perfil = db.usuarios[uid];
        const p = db.projetos[projetoId];
        if (!p || !p.visivelNaVitrine) falhar(E.indisponivel); // CT36
        if (p.donoId === uid) falhar(E.permissao);            // RN09
        const id = projetoId + "_" + uid;
        if (db.solicitacoes[id]) falhar(E.duplicada);          // RN09 / CT17
        db.solicitacoes[id] = { id, projetoId, solicitanteId: uid, donoId: p.donoId, tituloProjeto: p.titulo, nomeSolicitante: perfil.nome, tagsSolicitante: perfil.tags.slice(), status: "Pendente", motivo: null, motivoTexto: "", emailLiberado: null, criadaEm: agora(), atualizadaEm: agora() };
      });
    },
    recebidas(donoId) { return Object.values(db.solicitacoes).filter((s) => s.donoId === donoId).sort((a, b) => b.criadaEm - a.criadaEm); },
    minhas(uid) { return Object.values(db.solicitacoes).filter((s) => s.solicitanteId === uid).sort((a, b) => b.atualizadaEm - a.atualizadaEm); },
    /** Mesmo algoritmo da Function aceitarSolicitacao (Guia, 13.3). */
    async aceitar(id) {
      return transacao(() => {
        const s = solicitacaoDoDono(id, "Pendente");
        const p = db.projetos[s.projetoId] || falhar(E.naoEncontrado);
        if (p.status !== "Aberto" || p.vagasDisponiveis <= 0) falhar(E.precondicao);
        p.aceitos += 1;
        p.vagasDisponiveis = p.numeroVagas - p.aceitos;
        const fecha = p.vagasDisponiveis === 0;
        p.status = fecha ? "Fechado" : "Aberto";
        p.visivelNaVitrine = visivel(p.status, p.vagasDisponiveis);
        s.status = "Aceita"; s.emailLiberado = emailDe(s.solicitanteId); s.atualizadaEm = agora();
        const recusadas = fecha ? recusarPendentes(p.id, "VAGAS_PREENCHIDAS", s.id) : 0;
        return { fechou: fecha, recusadas };
      });
    },
    async recusar(id, motivo, texto) {
      if (!AH.MOTIVOS[motivo] || !AH.MOTIVOS[motivo].manual) falhar(E.argumento); // RN12
      await transacao(() => {
        const s = solicitacaoDoDono(id, "Pendente");
        s.status = "Recusada"; s.motivo = motivo;
        s.motivoTexto = motivo === "OUTRO" ? String(texto || "").trim().slice(0, V.MOTIVO_TEXTO_MAX) : "";
        s.atualizadaEm = agora();
      });
    },
    /** RN16: Aceita → Removida; vaga volta; status do projeto não muda. */
    async remover(id, texto) {
      await transacao(() => {
        const s = solicitacaoDoDono(id, "Aceita");
        const p = db.projetos[s.projetoId] || falhar(E.naoEncontrado);
        p.aceitos = Math.max(0, p.aceitos - 1);
        p.vagasDisponiveis = p.numeroVagas - p.aceitos;
        p.visivelNaVitrine = visivel(p.status, p.vagasDisponiveis);
        s.status = "Removida"; s.motivo = "REMOVIDO";
        s.motivoTexto = String(texto || "").trim().slice(0, V.MOTIVO_TEXTO_MAX); s.atualizadaEm = agora();
      });
    },
  };
})();
