# assets — ÁgoraHub

| Pasta / arquivo | Conteúdo |
|---|---|
| `paleta-de-cores.pdf` | Paleta em 2 páginas A4: cores principais, tema claro e escuro (com contraste WCAG), status, tipografia, ícones e logotipo |
| `logo/agorahub-icone.svg` | Ícone do app (quadrado arredondado azul #1F3A5F com “Á”) |
| `logo/agorahub-icone-maskable.svg` | Versão com margem de segurança para ícone adaptativo do Android / PWA |
| `logo/agorahub-simbolo.svg` | Só o “Á”, em azul, sem fundo |
| `logo/agorahub-logo-horizontal.svg` · `-branco.svg` | Ícone + nome + frase (fundo claro / fundo escuro) |
| `logo/png/` | PNGs do ícone em 16, 32, 48, 64, 128, 180, 192, 256, 512 e 1024 px, maskable 512 e logos horizontais |
| `logo/favicon.ico` | Favicon 16/32/48 px |
| `icones/*.svg` | 19 ícones da interface (24×24, estilo Material). Usam `fill="currentColor"`: pegam a cor do texto onde forem colocados |

Os textos dos logos foram convertidos em curvas (fonte Inter Bold), então abrem iguais em qualquer computador.

## Cores principais

| Papel | Claro | Escuro |
|---|---|---|
| Primária | `#1F3A5F` | `#A8C8F0` |
| Primária suave | `#D6E4F5` | `#28486F` |
| Secundária | `#2E75B6` | `#9CC3EC` |
| Terciária (sucesso) | `#1B5E20` | `#A5D6A7` |
| Erro | `#B3261E` | `#F2B8B5` |
| Aviso | `#FFF4D6` | `#3D3000` |
| Fundo | `#FAFBFD` | `#111418` |
| Texto | `#1A1C1E` | `#E2E2E6` |

Fonte das cores: `app/src/main/java/br/edu/ifal/agorahub/ui/theme/Theme.kt` (app Android) e `css/style.css` (web).

## Pacote para baixar

`agorahub-icones.zip` traz as pastas `icones/` e `logo/` (SVG, PNG e favicon) num arquivo só, para enviar à equipe ou importar no Figma/Canva.
