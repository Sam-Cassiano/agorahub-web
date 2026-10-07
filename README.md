# ÁgoraHub Web — protótipo navegável

Versão web (HTML + CSS + JavaScript puro) do app Android **ÁgoraHub** (`agorahub-app`), para demonstrar o produto no navegador, sem instalar nada.
Projeto Integrador 2 — Sistemas de Informação, IFAL Arapiraca.

Tem as **20 telas do Guia (T01–T20)**, os mesmos textos do `strings.xml`, as mesmas cores (claro e escuro) e as **mesmas regras** do modo demonstração do app (`RepositoriosDemo.kt`): vagas, fechamento automático na última vaga, recusa automática, remoção, encerrar/reabrir, exclusão só sem histórico e publicação só por admin.

## Contas de demonstração

Senha **`12345678`** em todas (`@aluno.ifal.edu.br`):

| Conta | Para quê |
|---|---|
| `demo@` | Admin; dono do projeto “App de acessibilidade” com 2 solicitações pendentes |
| `marina@`, `pedro@`, `camila@`, `isabela@`, `theo@` | Responder às solicitações como outro estudante |
| `bianca@` | Outro curso (Ciência da Computação) — diretório de Pessoas |
| `rafael@` | **Oculto** em Pessoas (CT46) |

No computador, o painel ao lado do celular troca de conta com um clique. Os dados ficam só no navegador (`localStorage`); use **Perfil › Restaurar dados de exemplo** para voltar ao início.

## Telas

| Tela | Rota |
|---|---|
| T01 Abertura · T02 Entrar · T03 Criar conta · T04 Verifique e-mail · T05 Recuperar senha | `#/abertura`, `#/login`, `#/cadastro`, `#/verificacao`, `#/recuperar` |
| T06 Onboarding (com aviso do diretório) · T07 Permissão de notificações | `#/onboarding`, `#/permissao` |
| T08 Mural de Oportunidades · T17 Publicar oportunidade (admin) | `#/home`, `#/publicar` |
| T09 Conexões › Projetos · T19 Conexões › Pessoas | `#/conexoes`, `#/conexoes?seg=pessoas` |
| T10 Detalhe do projeto · T11 Novo projeto | `#/projeto/{id}`, `#/novo-projeto` |
| T12 Perfil · T13 Editar perfil · T18 Privacidade e dados | `#/perfil`, `#/editar-perfil`, `#/privacidade` |
| T14 Solicitações recebidas · T15 Minhas solicitações · T16 Meus projetos | `#/recebidas`, `#/minhas`, `#/meus-projetos` |
| T20 Perfil do estudante | `#/pessoa/{uid}` |

## Modo de edição (estilo Figma)

Botão **Editar** no painel ao lado do celular, ou a tecla **E** (no celular, o botão de lápis no canto).

| Ação | Como |
|---|---|
| Selecionar | Clique em qualquer parte da tela (contorno azul com nome e medidas). ↑ seleciona o pai, ↓ o primeiro filho, Esc solta |
| Mudar texto | Duplo clique no texto, ou campo **Texto** no Inspetor. Textos mudam em todo o app (como o `strings.xml`) |
| Mudar estilo | Inspetor: cor do texto, fundo, borda, tamanho, peso, alinhamento, raio, espaços, largura, altura, opacidade, ocultar. Vale para a tela em que foi feito |
| Mudar cores do app | Aba **Tema**: as cores do tema claro ou escuro (o que estiver ativo) |
| Desfazer / refazer | Ctrl+Z / Ctrl+Shift+Z (ou os botões ↶ ↷) |
| Navegar entre telas | Desligue a edição (E), troque de tela e ligue de novo |

### Salvar e publicar na Vercel

- Tudo é salvo automaticamente **neste navegador**.
- Aba **Salvar / Figma › Baixar edicao.json** e substitua o `edicao.json` da raiz do projeto. Depois `git add . && git commit -m "Edição" && git push`: a Vercel publica e **todo mundo** que abrir o site vê a edição.
- Quem já editou no próprio navegador continua vendo a própria versão; use **Carregar a versão publicada** para voltar à do site.

### Levar para o Figma

Aba **Salvar / Figma**:
- **Copiar tela para o Figma** → no Figma, `Ctrl+V`. Vira camadas editáveis (fundos, textos em Roboto, ícones vetoriais).
- **Baixar tela (.svg)** → arraste o arquivo para o Figma.
- **Baixar todas as telas (.svg)** → 13 telas lado a lado, cada uma num grupo com o nome da tela (T08, T09…), já com as suas edições.

## Rodar no computador

Abra `index.html` direto no navegador, ou sirva a pasta:

```
npx serve .
# ou
python -m http.server 8000
```

## Publicar no GitHub

```
cd agorahub-web
git init
git add .
git commit -m "ÁgoraHub Web: protótipo navegável"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/agorahub-web.git
git push -u origin main
```

## Publicar na Vercel

1. Entre em <https://vercel.com> com a conta do GitHub › **Add New… › Project**.
2. Importe o repositório `agorahub-web`.
3. **Framework Preset: Other** · Build Command: *vazio* · Output Directory: *vazio* (raiz).
4. **Deploy**. A cada `git push` na `main`, a Vercel publica de novo.

Pela linha de comando: `npm i -g vercel` e depois `vercel --prod` dentro da pasta.

Não há build nem dependências: são arquivos estáticos. O `vercel.json` só liga URLs limpas e dois cabeçalhos de segurança.

## Estrutura

```
agorahub-web/
├─ index.html            página + painel de apresentação
├─ css/style.css         tema Material 3 (cores do Theme.kt), claro/escuro, responsivo
├─ js/dados.js           tags, motivos e dados de exemplo (= BancoDemo.kt)
├─ js/banco.js           "Firebase simulado": validações e regras (= RepositoriosDemo.kt)
├─ js/app.js             rotas e as 20 telas
├─ js/editor.js          modo de edição, salvar (edicao.json) e exportar SVG para o Figma
├─ edicao.json           edição publicada (vazia por padrão)
├─ assets/              ícones, logos (SVG/PNG/ICO) e paleta-de-cores.pdf
├─ icon.svg · manifest.webmanifest
└─ vercel.json
```

## Limites do protótipo

- Não há backend: nada é enviado a servidor, e não há e-mails nem push de verdade (“Já verifiquei” simula o link).
- O app de verdade é o Android em `agorahub-app` (Kotlin + Compose + Firebase).
