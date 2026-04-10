# Design de Páginas — Admin Gerador de Tabelas (Supabase)

## Diretrizes globais (desktop-first)
- Layout: Grid de 12 colunas (CSS Grid) com container central (max-width 1120–1200px) e espaçamento baseado em escala 4/8/12/16/24.
- Tipografia: base 16px; headings (24/20/18); texto auxiliar 14px.
- Cores (tokens):
  - Background: #0B1220 (ou branco se tema claro)
  - Surface/Card: #111A2E
  - Texto primário: #EAF0FF
  - Texto secundário: #A8B3CF
  - Accent primário: #4F46E5
  - Sucesso: #16A34A; Erro: #DC2626; Aviso: #F59E0B
- Componentes:
  - Botões: primary (accent), secondary (outline), danger (erro); hover com leve aumento de contraste e transition 150ms.
  - Inputs: borda 1px, foco com ring accent; estados de erro com borda/vermelho + helper text.
  - Tabelas/listas: linhas zebrado leve; cabeçalho fixo em listas longas.

---

## Página: Login

### Layout
- Estrutura centralizada (Flexbox) com card no centro.
- Breakpoints: desktop (card 420–480px), tablet (90vw), mobile (100vw com padding 16px).

### Meta Information
- Title: "Login | Admin"
- Description: "Acesse a área administrativa para gerar tabelas no Supabase."
- Open Graph: título e descrição iguais; sem imagem obrigatória.

### Page Structure
1) Header simples (logo/nome do produto)
2) Card de login
3) Rodapé mínimo (texto de ambiente/versão opcional)

### Sections & Components
- Card de autenticação
  - Campo e-mail
  - Campo senha (com toggle mostrar/ocultar)
  - Botão "Entrar"
  - Área de feedback (erro de credenciais / carregando)
- Comportamento
  - Enter submete
  - Loading state desabilita inputs/botão

---

## Página: Admin – Importar (/admin/importar)

### Layout
- Estrutura com sidebar + conteúdo (CSS Grid):
  - Sidebar fixa (2–3/12) com seção “Importar”.
  - Área de conteúdo (9–10/12) com cards/atalhos.
- Em telas menores: sidebar vira drawer no topo; cards em 1 coluna.

### Meta Information
- Title: "Importar | Admin"
- Description: "Acesse as ferramentas do módulo de importação."
- Open Graph: mesmo conteúdo; sem imagem obrigatória.

### Page Structure
1) AdminLayout (Sidebar + Topbar)
2) Conteúdo: cards/atalhos

### Sections & Components
- Sidebar (seção “Importar”)
  - Item ativo: “Importar”
  - Item: “Criar Tabelas Supabase” (link para /admin/importar/criar-tabelas)
- Topbar
  - Título: "Importar"
  - Ações: "Sair" (logout)
- Grid de cards
  - Card principal: “Criar Tabelas Supabase”
    - Descrição curta: “Gere tabelas de vendas e recebimentos por empresa/adquirente.”
    - CTA: botão “Acessar”

---

## Subpágina: Importar > Criar Tabelas Supabase (/admin/importar/criar-tabelas)

### Layout
- Página em duas colunas (CSS Grid):
  - Coluna esquerda (8/12): formulário e lista de campos
  - Coluna direita (4/12): prévia (nomes das tabelas + colunas) e ações
- Em telas menores: empilhar em uma coluna (formulário acima, prévia abaixo).

### Meta Information
- Title: "Criar Tabelas Supabase | Importar | Admin"
- Description: "Defina colunas e crie tabelas de vendas/recebimentos no Supabase por empresa e adquirente."
- Open Graph: mesmo conteúdo; sem imagem obrigatória.

### Page Structure
1) AdminLayout (Sidebar + Topbar)
2) Breadcrumbs: “Importar / Criar Tabelas Supabase”
3) Conteúdo principal (form + prévia)
4) Área de resultado (sucesso/erro)

### Sections & Components
- Sidebar
  - Seção “Importar” expandida
  - Item ativo: “Criar Tabelas Supabase”
- Topbar
  - Título: "Criar Tabelas Supabase"
  - Ações: "Sair" (logout)
- Formulário: Perguntas (Identificação)
  - Pergunta 1: Input "Empresa" (obrigatório)
  - Pergunta 2: Select "Adquirente" (obrigatório) ou input com sugestão (se lista não existir)
  - Helper text: "Usado para compor o nome das tabelas"
- Formulário: Campos (colunas)
  - Lista de linhas (repetível), cada linha contém:
    - Pergunta: Input "Nome do campo" (ex.: nsu, data_venda)
    - Pergunta: Select "Tipo" (texto, número, decimal, data, timestamp, booleano)
    - Botões: remover; mover (↑/↓) quando aplicável
  - Botão "Adicionar campo"
  - Validações inline:
    - Nome duplicado
    - Nome inválido (caracteres proibidos)
    - Tipo não selecionado
- Painel de Prévia (coluna direita)
  - Card "Tabelas a criar"
    - `vendas__{empresa}__{adquirente}`
    - `recebimentos__{empresa}__{adquirente}`
  - Card "Colunas"
    - Lista final (inclui `id`, `created_at` se adotadas)
  - Card de Ação
    - Checkbox/Confirmação: "Entendo que isso criará tabelas no banco"
    - Botão primário "Criar tabelas" (chama backend/RPC)
- Resultado
  - Toast/Alert de sucesso: mostrar nomes finais das tabelas
  - Alert de erro: mensagem curta + detalhe técnico colapsável
- Estados
  - Loading: skeleton no painel de prévia; botão com spinner
  - Empty state: quando sem campos, mostrar instrução "Adicione ao menos 1 campo"
  - Disabled: bloquear criação até validações passarem e confirmação marcada
