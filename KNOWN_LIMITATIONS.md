# Limitações conhecidas

## 1. Escopo global compartilhado (por design, não é bug)

Como os módulos são scripts clássicos (não ES modules), todas as
funções e variáveis (`D`, `MELI_DATA`, `AMZ_DATA`, `SNF`, `HIST_SHOPEE`,
etc.) continuam vivendo no mesmo escopo global `window` — exatamente
como no arquivo original. Isso significa que:

- Não há encapsulamento real entre módulos; qualquer arquivo pode, em
  teoria, acessar/sobrescrever variáveis de outro.
- Duas variáveis de nomes iguais em módulos diferentes causariam
  conflito. Confirmei que isso não ocorre hoje (o arquivo original já
  não tinha duplicatas, e a divisão não criou nenhuma), mas é um risco
  a observar em manutenções futuras.

Essa é uma limitação inerente à decisão de manter compatibilidade com
`file://` (ver ARCHITECTURE.md). Migrar para ES modules resolveria isso,
mas exige um passo adicional (servidor local ou build), fora do escopo
desta refatoração.

## 2. Código duplicado entre marketplaces não foi consolidado

Shopee, Mercado Livre, Amazon e Shopee NF têm implementações próprias
e ligeiramente diferentes de conceitos parecidos: leitura de XLSX,
formatação de moeda/data, parsing de arquivo. Por regra explícita do
projeto ("não otimizar, não simplificar"), essas duplicações foram
**preservadas integralmente**, cada uma isolada em seu módulo. Unificar
essas implementações é uma melhoria válida, mas arriscada sem testes
automatizados robustos — ver `TODO.md`.

## 3. Sem testes automatizados de regressão

A verificação desta refatoração foi feita por:
- comparação byte-a-byte/linha-a-linha do código-fonte;
- checagem de sintaxe (`node --check`);
- teste de carregamento e navegação via jsdom (headless).

Não foram criados testes unitários ou de regressão cobrindo os cálculos
de negócio (ex.: `calcTaxas`, `parseAmzTSV`, `crossErpSettlement`) com
arquivos de entrada reais. Isso é recomendado antes de considerar este
projeto modular como substituto definitivo do arquivo original em
produção — ver `TODO.md`.

## 4. CSS reordenado dentro dos arquivos combinados

Ao dividir o `<style>` original em 5 arquivos, alguns blocos que não
eram fisicamente adjacentes no arquivo original (ex.: estilos de
filtros e estilos do drawer/hub) foram agrupados no mesmo arquivo
(`components.css`), o que muda a ordem relativa desses blocos frente à
tabela (`tables.css`). Verifiquei que os seletores não se sobrepõem
(são IDs/classes distintos por componente), então não há mudança visual
esperada — mas isso não foi testado visualmente pixel-a-pixel, apenas
por inspeção de seletores.

## 5. Dependências externas inalteradas

O sistema continua dependendo de duas URLs externas, carregadas via CDN
no `index.html`:
- `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`
- Google Fonts (DM Mono, Syne, DM Sans)

Isso é idêntico ao comportamento do arquivo original — o sistema precisa
de conexão com a internet para funcionar corretamente (não há fallback
offline nem os arquivos foram baixados para `libs/`/`assets/`).

## 6. `file://` (duplo clique) NÃO é confiável — use um servidor local

Diferente do arquivo original (que era um único HTML e sempre funcionou
com duplo clique), este projeto modular carrega 35 arquivos `.js` e 5
`.css` externos via `<script src>`/`<link href>`. Testamos e confirmamos
que abrir `index.html` direto pelo `file://` (duplo clique) faz o
navegador bloquear silenciosamente esses arquivos locais em vários
casos — a tela abre, mas sem estilo e sem nenhum botão funcionando, sem
nenhum erro visível fora do Console (F12).

**Use sempre um servidor local**, por exemplo a extensão **Live Server**
do VS Code (botão direito no `index.html` → "Open with Live Server") ou
`python -m http.server` na pasta do projeto. Não há build step nem
`package.json` — qualquer servidor estático simples resolve.
