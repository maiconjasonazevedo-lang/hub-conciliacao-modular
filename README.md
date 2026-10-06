# Hub de Conciliação Marketplaces — versão modular

Versão modularizada do `hub_conciliacao_marketplaces_V21.html` original.
Mesma lógica, mesmos cálculos, mesmo comportamento — apenas organizado
em arquivos separados. Ver `ARCHITECTURE.md` para detalhes da estrutura
e `CHANGELOG.md` para o que mudou (estruturalmente) em relação ao
arquivo original.

## Como abrir — IMPORTANTE

⚠️ **Não abra o `index.html` com duplo clique.** Este projeto carrega
35 arquivos `.js` e 5 `.css` externos, e os navegadores bloqueiam esse
tipo de carregamento local (`file://`) com frequência — a tela abre,
mas sem estilo e sem nenhum botão funcionando, sem erro visível na
tela (só no Console do navegador). O arquivo original não tinha esse
problema por ser um único HTML; ao modularizar, isso passou a exigir
um servidor local.

### Opção 1 — VS Code + Live Server (recomendado)

1. Abra a pasta deste projeto no VS Code.
2. Instale a extensão **Live Server** (autor: Ritwick Dey).
3. Clique com o botão direito em `index.html` → **"Open with Live Server"**.
4. Abre em `http://127.0.0.1:5500/index.html`.

### Opção 2 — Servidor Python (sem precisar do VS Code)

Na pasta do projeto:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000/index.html` no navegador.

## Requisitos

- Conexão com a internet: o sistema carrega a biblioteca XLSX e as
  fontes (Google Fonts) via CDN, igual ao arquivo original.
- Nenhuma instalação de dependências (`npm install`), build step ou
  `package.json` — é só HTML/CSS/JS estático.

## Estrutura

Ver `ARCHITECTURE.md`.

## Estado atual do projeto

- Versão atual no front: `3.1.3`
- Build atual: `b66bc41`
- Deploy: GitHub Pages ativo
- Atualização recente principal: ajustes de saque, DCC e quantidade de itens da Shopee

## Deploy e publicação

O projeto está publicado via GitHub Pages a partir da branch `main` e usa um workflow em `.github/workflows/deploy-pages.yml` para publicar o site estático automaticamente.

## Documentos do projeto

- `ARCHITECTURE.md` — como o sistema está organizado e por quê.
- `ROADMAP.md` — andamento da migração (todas as etapas concluídas).
- `CHANGELOG.md` — mudanças estruturadas e release notes.
- `DOCUMENTACAO_CHECKPOINT.md` — estado atual, versões e validação do app.
- `KNOWN_LIMITATIONS.md` — limitações conhecidas (leia antes de usar em produção).
- `TODO.md` — melhorias futuras opcionais (nada aqui foi implementado).
