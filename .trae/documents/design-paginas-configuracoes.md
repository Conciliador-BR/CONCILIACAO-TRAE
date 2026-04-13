# Design de Páginas — Reorganização “Configurações” (desktop-first)

## Global Styles (tokens)
- Background: #0B1220 (app) e #0F172A (cards)
- Texto primário: #E5E7EB; secundário: #94A3B8
- Accent/primary: #3B82F6
- Tipografia (escala): 12/14/16/20/24; títulos com peso 600
- Botões: primary (filled), secondary (outline), disabled com opacidade 50%
- Links: underline no hover; foco visível (outline 2px)

## Página: Configurações (/configuracoes)
### Layout
- Grid 12 colunas (desktop), com container central (máx 1200–1280px).
- Cabeçalho fixo/estático do app (se já existir) + conteúdo com espaçamento vertical 24px.

### Meta Information
- Title: Configurações
- Description: Área principal de configurações e acesso às seções.
- OG: og:title=Configurações; og:type=website

### Page Structure
- Topo: título da página + descrição curta.
- Corpo: layout 2 colunas
  - Coluna esquerda (240–280px): navegação interna.
  - Coluna direita (flex): área de conteúdo aninhado (slot/`<NuxtPage/>`).

### Sections & Components
1. Breadcrumbs (opcional): “Configurações / {Subpágina}”.
2. Header da página
   - H1 “Configurações”
   - Texto auxiliar (1 linha).
3. Navegação interna (componente de menu/abas)
   - Itens: Importação, Auditoria, Cadastro.
   - Estado ativo destacado (barra/realce) e acessível via teclado.
4. Container de conteúdo
   - Card principal com padding 24px.
   - Renderiza a subpágina atual sem recarregar o layout.

## Subpágina: Importação (/configuracoes/importacao)
### Layout
- Conteúdo em coluna única dentro do card do container.

### Meta Information
- Title: Configurações — Importação
- Description: Seção de importação dentro de Configurações.

### Sections & Components
- Header da seção: título “Importação” + breve instrução.
- Área de conteúdo específica da seção (componentes existentes, apenas realocados).

## Subpágina: Auditoria (/configuracoes/auditoria)
### Layout
- Conteúdo em coluna única dentro do card do container.

### Meta Information
- Title: Configurações — Auditoria
- Description: Seção de auditoria dentro de Configurações.

### Sections & Components
- Header da seção: título “Auditoria”.
- Área de conteúdo específica da seção (componentes existentes, apenas realocados).

## Subpágina: Cadastro (/configuracoes/cadastro)
### Layout
- Conteúdo em coluna única dentro do card do container.

### Meta Information
- Title: Configurações — Cadastro
- Description: Seção de cadastro dentro de Configurações.

### Sections & Components
- Header da seção: título “Cadastro”.
- Área de conteúdo específica da seção (componentes existentes, apenas realocados).

## Responsive (mínimo necessário)
- <= 1024px: navegação interna vira abas horizontais no topo do conteúdo.
- <= 640px: paddings reduzidos (24px -> 16px), tipografia 24 -> 20 no H1.
