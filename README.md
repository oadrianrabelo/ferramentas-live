# Ferramentas Live

Kit de ferramentas para quem transmite cultos, estudos e programas ao vivo. Gera as imagens que vão para a tela, controla o tempo, rola o texto e prepara a publicação — **funciona offline**, no **Windows, macOS, Linux, Android** e no **navegador** (inclusive iPhone, como app instalado pela web).

## Ferramentas

### Imagens (PNG prontas para TV, OBS, stories e feed)

| Ferramenta        | O que faz                                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Comentários**   | Fila de comentários do chat, 1–3 por imagem, foto ou iniciais, selo da origem (YouTube, Instagram…). Cola vários de uma vez (`nome: comentário`), passa com as setas e **baixa todas** de uma vez. Modo **overlay** com fundo transparente. |
| **Tarja de nome** | Lower third transparente com nome e função, três estilos, lista de pessoas salvas.                                                                                                                                                          |
| **Versículo**     | Texto bíblico ou citação com referência e versão.                                                                                                                                                                                           |
| **Aviso**         | Comunicado com data, horário, local e QR code opcional.                                                                                                                                                                                     |
| **Enquete**       | Conte votos ao vivo (teclas 1–9) e mostre o resultado em barras.                                                                                                                                                                            |
| **Miniatura**     | Thumbnail 1280×720 para o YouTube, com foto de fundo e pessoa.                                                                                                                                                                              |
| **PIX e QR Code** | Gera o PIX copia-e-cola no padrão do Banco Central e a tela de oferta com QR.                                                                                                                                                               |

Todas têm **8 temas**, formatos **16:9, 9:16, 1:1 e 4:5**, e usam a **Identidade** (nome do programa, cidade, logo, rodapé, cor) configurada uma vez.

### Ao vivo

| Ferramenta       | O que faz                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cronômetro**   | Contagem para o início (até um horário), tempo do pregador com amarelo/vermelho e bip, cronômetro e relógio. Abre em **outra janela sincronizada** para o telão/OBS.                  |
| **Teleprompter** | Rolagem suave, velocidade ajustável, espelho, linha-guia, 3-2-1, atalhos de teclado e passador de slides.                                                                             |
| **Roteiro**      | Momentos da live com duração e responsável; ao vivo mostra quanto falta, se está atrasado e a previsão de término. Tela para a equipe e **capítulos do YouTube** com os tempos reais. |
| **Sorteio**      | Cole os nomes, remova repetidos e sorteie com animação (gerador criptográfico).                                                                                                       |
| **Checklist**    | Lista editável do que conferir antes de entrar no ar.                                                                                                                                 |

### Publicar

**Kit de publicação**: título, descrição (com capítulos do Roteiro) e tags prontos para copiar, a partir de modelos editáveis.

## Baixar

Vá em **[Releases](../../releases/latest)**:

- **Windows**: `*_x64-setup.exe` (ou `.msi`)
- **macOS**: `*_universal.dmg` — na primeira vez, clique com o botão direito → _Abrir_ (o app não é assinado pela Apple)
- **Linux**: `.AppImage`, `.deb` ou `.rpm`
- **Android**: `*_android-arm64.apk` (celulares dos últimos ~8 anos) ou `*_android-arm.apk` (aparelhos antigos)
- **Web / iPhone**: abra a versão web (GitHub Pages do repositório) e use _Adicionar à Tela de Início_

O app avisa de novas versões em **Sobre e versões**.

## Tecnologia

- **[Svelte 5](https://svelte.dev)** (runes) + **TypeScript** + **[Vite](https://vite.dev)** — interface reativa sem runtime pesado; cada ferramenta é carregada sob demanda.
- **[Tauri 2](https://tauri.app)** — app nativo usando o WebView do sistema: instaladores de poucos MB e **APK leve** (Rust compilado com `opt-level="s"`, LTO, `strip`, um APK por arquitetura).
- **Canvas 2D** para gerar as imagens em alta resolução, fonte Poppins embutida (offline).
- **PWA** com service worker para a versão web funcionar sem internet.
- Dados salvos localmente (com backup/restauração em JSON). Nada é enviado para servidor.

## Desenvolvimento

Requisitos: Node 22+, pnpm 10, Rust stable. Para o app nativo, as [dependências do Tauri](https://tauri.app/start/prerequisites/).

```bash
pnpm install
pnpm dev            # web em http://localhost:5173
pnpm tauri dev      # app desktop
pnpm tauri android dev   # Android (após `pnpm tauri android init`)

pnpm check          # tipos (svelte-check)
pnpm test           # testes (vitest)
pnpm format         # prettier
pnpm build          # build web em dist/
pnpm tauri build    # instalador desktop
```

### Commits e versões

O projeto usa **[Conventional Commits](https://www.conventionalcommits.org/pt-br/)** (validados pelo `commitlint` no hook `commit-msg` via lefthook e no CI) e **versionamento semântico** automático:

| Commit                                         | Efeito                         |
| ---------------------------------------------- | ------------------------------ |
| `fix: corrige quebra de linha no versículo`    | versão de correção (1.0.**1**) |
| `feat: adiciona tema natalino`                 | versão nova (1.**1**.0)        |
| `feat!: …` ou rodapé `BREAKING CHANGE:`        | versão maior (**2**.0.0)       |
| `docs:`, `chore:`, `ci:`, `refactor:`, `test:` | não gera versão sozinho        |

### Como sai uma versão

1. Commits na `main` → o **release-please** abre/atualiza um PR "chore(main): release x.y.z" com o `CHANGELOG.md` e as versões (`package.json`, `Cargo.toml`) atualizados.
2. Ao mesclar esse PR, a tag e a release são criadas e o workflow **Build** anexa os instaladores de Windows, macOS, Linux e Android, e publica a versão web no GitHub Pages.

Para testar os builds sem lançar versão: _Actions → Build → Run workflow_ (os arquivos ficam como artefatos).

### Configuração única do repositório

- _Settings → Actions → General → Workflow permissions_: **Read and write** e marcar **Allow GitHub Actions to create and approve pull requests** (para o PR de versão).
- _Settings → Pages → Source_: **GitHub Actions**.
- Assinatura do Android: veja [docs/ANDROID.md](docs/ANDROID.md).

### Estrutura

```
src/
  lib/            lógica e componentes compartilhados
    canvas/       desenho (temas, formatos, moldura, imagens)
    components/   UI reutilizável (prévia, seletores, cronômetro, teleprompter…)
    *.svelte.ts   estados salvos e sincronizados entre janelas
    parse.ts, pix.ts, qr.ts   funções puras (com testes)
  tools/          uma tela por ferramenta + telas de exibição (displays/)
src-tauri/        app nativo (Rust)
.github/workflows CI, release e builds
```

## Licença

[MIT](LICENSE)
