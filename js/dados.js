/*
 * ÁgoraHub Web — dados de demonstração.
 * Mesmo conteúdo do BancoDemo.kt do app Android (agorahub-app/app/src/main/java/.../data/demo).
 * Contas: senha 12345678 em todas.
 */
window.AH = window.AH || {};

AH.SENHA_PADRAO = "12345678";
AH.EMAIL_DEMO = "demo@aluno.ifal.edu.br";

/** Lista fechada de tags (Guia, Apêndice B). */
AH.TAGS = [
  { id: "TAG01", nome: "Mobile", grupo: "Desenvolvimento", descricao: "Apps para celular (Android/iOS)" },
  { id: "TAG02", nome: "Web", grupo: "Desenvolvimento", descricao: "Sites e sistemas web (front-end)" },
  { id: "TAG03", nome: "Back-end", grupo: "Desenvolvimento", descricao: "APIs, servidores e integrações" },
  { id: "TAG04", nome: "Jogos", grupo: "Desenvolvimento", descricao: "Desenvolvimento de jogos digitais" },
  { id: "TAG05", nome: "Ciência de Dados", grupo: "Dados e IA", descricao: "Análise e visualização de dados" },
  { id: "TAG06", nome: "Inteligência Artificial", grupo: "Dados e IA", descricao: "Machine learning, chatbots, visão computacional" },
  { id: "TAG07", nome: "Banco de Dados", grupo: "Dados e IA", descricao: "Modelagem e administração de bancos" },
  { id: "TAG08", nome: "UX/UI", grupo: "Design", descricao: "Experiência do usuário e design de interfaces" },
  { id: "TAG09", nome: "Design Gráfico", grupo: "Design", descricao: "Identidade visual, ilustração, peças gráficas" },
  { id: "TAG10", nome: "Redes", grupo: "Infraestrutura", descricao: "Redes de computadores e telecom" },
  { id: "TAG11", nome: "Cloud/DevOps", grupo: "Infraestrutura", descricao: "Nuvem, deploy, automação" },
  { id: "TAG12", nome: "Segurança da Informação", grupo: "Infraestrutura", descricao: "Segurança, privacidade e LGPD" },
  { id: "TAG13", nome: "IoT e Embarcados", grupo: "Hardware", descricao: "Arduino, sensores, sistemas embarcados" },
  { id: "TAG14", nome: "Robótica", grupo: "Hardware", descricao: "Robôs e automação física" },
  { id: "TAG15", nome: "Pesquisa Acadêmica", grupo: "Pesquisa, gestão e sociedade", descricao: "Iniciação científica e artigos" },
  { id: "TAG16", nome: "Gestão de Projetos", grupo: "Pesquisa, gestão e sociedade", descricao: "Planejamento, métodos ágeis, liderança" },
  { id: "TAG17", nome: "Empreendedorismo", grupo: "Pesquisa, gestão e sociedade", descricao: "Startups, modelos de negócio" },
  { id: "TAG18", nome: "Acessibilidade", grupo: "Pesquisa, gestão e sociedade", descricao: "Tecnologia assistiva e design inclusivo" },
  { id: "TAG19", nome: "Ensino e Monitoria", grupo: "Pesquisa, gestão e sociedade", descricao: "Monitoria, tutoria e ensino" },
  { id: "TAG20", nome: "Programação Competitiva", grupo: "Pesquisa, gestão e sociedade", descricao: "Maratonas de programação e algoritmos" },
];

AH.MOTIVOS = {
  VAGAS_PREENCHIDAS: { rotulo: "Vagas já preenchidas", manual: true },
  PERFIL_NAO_COMPATIVEL: { rotulo: "Perfil não compatível", manual: true },
  PRAZO_INCOMPATIVEL: { rotulo: "Prazo incompatível", manual: true },
  OUTRO: { rotulo: "Outro", manual: true },
  PROJETO_ENCERRADO: { rotulo: "Projeto encerrado pelo responsável", manual: false },
  REMOVIDO: { rotulo: "Removido pelo responsável", manual: false },
};

AH.STATUS_PROJETO = { Aberto: "Aberto", Fechado: "Fechado — vagas preenchidas", Encerrado: "Encerrado" };
AH.STATUS_SOL = { Pendente: "Pendente", Aceita: "Aceita", Recusada: "Recusada", Removida: "Removida" };

/** Monta o banco inicial (equivalente a BancoDemo.popular()). */
AH.bancoInicial = function () {
  const H = 3600000;
  const agora = Date.now();
  const diasAtras = (d, h = 0) => agora - (d * 24 + h) * H;

  const db = { contas: [], usuarios: {}, oportunidades: [], projetos: {}, solicitacoes: {}, sessao: null };

  function conta(uid, email, nome, tags, papel = "estudante", curso = "Sistemas de Informação", visivel = true) {
    db.contas.push({ uid, email, senha: AH.SENHA_PADRAO, verificado: true });
    db.usuarios[uid] = { uid, nome, curso, tags, papel, onboardingConcluido: true, visivelNoDiretorio: visivel };
  }
  conta("u-demo", AH.EMAIL_DEMO, "Estudante Demo", ["TAG01", "TAG08", "TAG18"], "admin");
  conta("u-marina", "marina@aluno.ifal.edu.br", "Marina Coutinho", ["TAG06", "TAG08", "TAG05"]);
  conta("u-pedro", "pedro@aluno.ifal.edu.br", "Pedro Henrique", ["TAG01", "TAG02", "TAG04"]);
  conta("u-camila", "camila@aluno.ifal.edu.br", "Camila Duarte", ["TAG09", "TAG08", "TAG15"]);
  conta("u-isabela", "isabela@aluno.ifal.edu.br", "Isabela Farias", ["TAG18", "TAG02", "TAG16"]);
  conta("u-theo", "theo@aluno.ifal.edu.br", "Théo Farias", ["TAG19", "TAG03", "TAG07"]);
  conta("u-bianca", "bianca@aluno.ifal.edu.br", "Bianca Lima", ["TAG01", "TAG18", "TAG05"], "estudante", "Ciência da Computação");
  conta("u-rafael", "rafael@aluno.ifal.edu.br", "Rafael Souza", ["TAG01", "TAG08", "TAG02"], "estudante", "Sistemas de Informação", false);

  const link = "https://www2.ifal.edu.br/";
  db.oportunidades = [
    { id: "o1", titulo: "Edital de Iniciação Científica 2026.2", resumo: "Bolsas para projetos de pesquisa com orientação de professores do campus. Inscrições até o fim do mês.", imagemUrl: null, linkExterno: link, publicadoEm: diasAtras(0, 3) },
    { id: "o2", titulo: "Hackathon de Acessibilidade", resumo: "Maratona de 24 horas para criar soluções inclusivas. Equipes de 3 a 5 pessoas, com premiação.", imagemUrl: null, linkExterno: link, publicadoEm: diasAtras(1) },
    { id: "o3", titulo: "Seleção de monitores — Programação I", resumo: "Vagas de monitoria para o próximo semestre, com certificado de horas complementares.", imagemUrl: null, linkExterno: link, publicadoEm: diasAtras(2) },
    { id: "o4", titulo: "Semana de Tecnologia do Campus Arapiraca", resumo: "Palestras, minicursos e apresentação de projetos. Aberta a todos os cursos.", imagemUrl: null, linkExterno: link, publicadoEm: diasAtras(4) },
    { id: "o5", titulo: "Maratona de Programação — etapa regional", resumo: "Formação de equipes de 3 estudantes para a etapa regional.", imagemUrl: null, linkExterno: link, publicadoEm: diasAtras(6) },
  ];

  function projeto(id, dono, titulo, descricao, vagas, aceitos, tags, status, dias) {
    const livres = vagas - aceitos;
    db.projetos[id] = {
      id, donoId: dono, donoNome: db.usuarios[dono].nome, titulo, descricao,
      numeroVagas: vagas, aceitos, vagasDisponiveis: livres, tagsNecessarias: tags,
      status, visivelNaVitrine: status === "Aberto" && livres > 0, criadoEm: diasAtras(dias),
    };
  }
  projeto("p1", "u-demo", "App de acessibilidade para o campus",
    "Queremos criar um aplicativo que descreve salas, laboratórios e caminhos do campus para pessoas com deficiência visual. Procuramos quem goste de Android, UX e acessibilidade.",
    3, 1, ["TAG01", "TAG08", "TAG18"], "Aberto", 3);
  projeto("p2", "u-marina", "Chatbot de avisos da turma",
    "Um bot que resume os avisos importantes da semana e lembra os prazos de entrega. Vamos usar IA para classificar as mensagens.",
    2, 0, ["TAG03", "TAG06"], "Aberto", 2);
  projeto("p3", "u-pedro", "Grupo para a maratona de programação",
    "Treinos semanais de algoritmos para a maratona regional. Todos os níveis são bem-vindos.",
    2, 0, ["TAG20"], "Aberto", 1);
  projeto("p4", "u-isabela", "Pesquisa sobre acessibilidade digital no IFAL",
    "Levantamento da acessibilidade dos sistemas usados pelos estudantes, com proposta de melhorias. Pode virar artigo.",
    1, 0, ["TAG15", "TAG18"], "Aberto", 5);
  projeto("p5", "u-theo", "Monitoria colaborativa de Banco de Dados",
    "Grupo para organizar listas de exercícios e plantões de dúvidas de Banco de Dados.",
    3, 1, ["TAG07", "TAG19"], "Aberto", 7);
  projeto("p6", "u-camila", "Jogo educativo sobre lógica",
    "Jogo para ajudar calouros com lógica de programação.",
    1, 1, ["TAG04", "TAG09"], "Fechado", 9);

  function sol(projetoId, solicitante, status, motivo = null, dias = 0) {
    const p = db.projetos[projetoId];
    const u = db.usuarios[solicitante];
    const id = projetoId + "_" + solicitante;
    const email = db.contas.find((c) => c.uid === solicitante).email;
    db.solicitacoes[id] = {
      id, projetoId, solicitanteId: solicitante, donoId: p.donoId, tituloProjeto: p.titulo,
      nomeSolicitante: u.nome, tagsSolicitante: u.tags.slice(), status, motivo, motivoTexto: "",
      emailLiberado: status === "Aceita" ? email : null,
      criadaEm: diasAtras(dias), atualizadaEm: diasAtras(dias, -2),
    };
  }
  sol("p1", "u-isabela", "Aceita", null, 2);
  sol("p1", "u-pedro", "Pendente", null, 1);
  sol("p1", "u-camila", "Pendente", null, 0);
  sol("p1", "u-theo", "Recusada", "PRAZO_INCOMPATIVEL", 2);
  sol("p2", "u-demo", "Pendente", null, 1);
  sol("p5", "u-demo", "Aceita", null, 6);
  sol("p6", "u-demo", "Recusada", "VAGAS_PREENCHIDAS", 8);
  sol("p6", "u-pedro", "Aceita", null, 8);
  sol("p2", "u-pedro", "Pendente", null, 0);

  return db;
};
