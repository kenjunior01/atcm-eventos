# ATCM Eventos - Documentação Completa do Sistema

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura e Stack Tecnológica](#arquitetura-e-stack-tecnológica)
3. [Modelagem de Dados](#modelagem-de-dados)
4. [Funcionalidades Implementadas](#funcionalidades-implementadas)
5. [APIs Disponíveis](#apis-disponíveis)
6. [Interfaces do Usuário](#interfaces-do-usuario)
7. [Relatórios e Estatísticas](#relatórios-e-estatísticas)
8. [PWA Features](#pwa-features)
9. [Segurança](#segurança)
10. [Instalação e Deploy](#instalação-e-deploy)

---

## Visão Geral

O **ATCM Eventos** é um sistema de gestão de eventos de desporto motorizado desenvolvido para o Autódromo de Maputo. É uma Progressive Web App (PWA) completa que permite:

- Gestão centralizada de stakeholders (pilotos, fornecedores, patrocinadores, colaboradores)
- Criação e gestão dinâmica de eventos com categorias personalizáveis
- Sistema de inscrições com controle de concorrência para picos de acesso
- Validação financeira com upload de comprovativos
- Sistema de notificações (Email, SMS, Push)
- Relatórios avançados e dashboards em tempo real
- Experiência de app nativo (instalável em dispositivos móveis)

---

## Arquitetura e Stack Tecnológica

### Frontend
- **Next.js 14** (App Router) - Framework React com Server-Side Rendering
- **TypeScript** - Type safety
- **TailwindCSS** - Styling utility-first
- **Recharts** - Gráficos e visualizações de dados
- **Radix UI** - Componentes UI acessíveis
- **React Hook Form** - Gestão de formulários
- **Zod** - Validação de schemas

### Backend
- **Next.js API Routes** - Serverless functions
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Banco de dados relacional
- **NextAuth.js v5** - Autenticação moderna
- **bcryptjs** - Hash de senhas

### Serviços Externos
- **Resend** - Envio de emails
- **Twilio** - Envio de SMS
- **Vercel Blob** - Storage de arquivos

### Deploy
- **Vercel** - Hosting e deploy automático

---

## Modelagem de Dados

### Enums Principais

```typescript
enum StakeholderType {
  CLIENTE,
  PILOTO,
  FORNECEDOR,
  PATROCINADOR,
  COLABORADOR
}

enum Role {
  SUPERADMIN,
  ADMIN,
  STAFF,
  FINANCEIRO,
  VALIDADOR_PAGAMENTO
}

enum RegistrationStatus {
  PENDENTE,
  APROVADO,
  REJEITADO,
  CANCELADO
}

enum EventStatus {
  RASCUNHO,
  ATIVO,
  FINALIZADO,
  CANCELADO
}
```

### Tabelas Principais

#### Stakeholders
- Base centralizada de todos os stakeholders
- Relacionamento 1:1 com Users
- Tipos: Cliente, Piloto, Fornecedor, Patrocinador, Colaborador

#### Users
- Autenticação e autorização
- Roles hierárquicos (SUPERADMIN > ADMIN > STAFF > FINANCEIRO > VALIDADOR_PAGAMENTO)
- Senhas hash com bcrypt

#### Events
- Eventos com status lifecycle
- Relacionamento 1:N com EventCategories
- Campos obrigatórios dinâmicos por categoria

#### EventCategories
- Categorias com vagas limitadas
- Taxas de inscrição por categoria
- Campos obrigatórios customizáveis (JSON)

#### Registrations
- Inscrições com controle de concorrência (SELECT FOR UPDATE)
- Status workflow (PENDENTE → APROVADO/REJEITADO)
- Campos personalizados (JSON)

#### PaymentProof
- Upload de comprovativos via Vercel Blob
- Validação de tipo (PDF/Imagens) e tamanho (10MB)

#### PaymentValidation
- Validação financeira com motivo
- Notificação automática após validação

#### NotificationLog
- Log de todas as notificações
- Status de envio (PENDENTE, ENVIADO, FALHOU)
- Canais: EMAIL, SMS, PUSH

---

## Funcionalidades Implementadas

### 1. Gestão de Stakeholders
- CRUD completo de stakeholders
- Filtragem por tipo e busca
- Relacionamento com usuários
- Proteção RBAC (Admin não vê SuperAdmins)

### 2. Gestão de Eventos
- Criação de eventos com múltiplas categorias
- Campos obrigatórios dinâmicos por categoria
- Controle de vagas por categoria
- Status lifecycle (RASCUNHO → ATIVO → FINALIZADO)
- Notificação em massa ao criar/ativar eventos

### 3. Sistema de Inscrições
- Formulário dinâmico baseado na categoria
- Upload de comprovativo de pagamento
- **Controle de concorrência** com SELECT FOR UPDATE
- Verificação de vagas em tempo real
- Prevenção de race conditions

### 4. Validação Financeira
- Painel de validação para admins
- Aprovação/Rejeição com motivo
- Verificação de vagas antes de aprovar
- Notificação automática ao piloto

### 5. Sistema de Notificações
- **Email** via Resend com templates HTML
- **SMS** via Twilio
- **Push** (preparado para implementação)
- Gatilhos automáticos:
  - Novo evento criado/ativado
  - Inscrição aprovada/rejeitada
  - Evento cancelado

### 6. Autenticação e Autorização
- NextAuth.js v5 com credentials provider
- RBAC com 5 níveis de permissão
- Middleware de proteção de rotas
- Sessões JWT

### 7. PWA Completo
- Service Worker para cache e offline
- Manifest com múltiplos ícones
- Atalhos para acesso rápido
- Componente de instalação customizado
- Meta tags para iOS, Android, Windows

---

## APIs Disponíveis

### Autenticação
- `POST /api/auth/[...nextauth]` - NextAuth handler

### Eventos
- `GET /api/eventos` - Listar eventos (com filtros e paginação)
- `POST /api/eventos` - Criar evento
- `GET /api/eventos/[id]` - Detalhes do evento
- `PATCH /api/eventos/[id]` - Atualizar evento
- `DELETE /api/eventos/[id]` - Excluir evento

### Inscrições
- `GET /api/inscricoes` - Listar inscrições (com filtros)
- `POST /api/inscricoes` - Criar inscrição (com controle de concorrência)
- `GET /api/inscricoes/[id]` - Detalhes da inscrição
- `PATCH /api/inscricoes/[id]` - Atualizar inscrição
- `DELETE /api/inscricoes/[id]` - Cancelar inscrição

### Validações
- `GET /api/validacoes` - Listar validações pendentes
- `POST /api/validacoes` - Aprovar/rejeitar inscrição

### Upload
- `POST /api/upload/comprovativo` - Upload de comprovativo

### Stakeholders
- `GET /api/stakeholders` - Listar stakeholders
- `POST /api/stakeholders` - Criar stakeholder
- `GET /api/stakeholders/[id]` - Detalhes
- `PATCH /api/stakeholders/[id]` - Atualizar
- `DELETE /api/stakeholders/[id]` - Excluir

### Usuários
- `GET /api/users` - Listar usuários (com proteção RBAC)
- `POST /api/users` - Criar usuário (com proteção RBAC)

### Relatórios
- `GET /api/relatorios/dashboard` - Métricas do dashboard
- `GET /api/relatorios/evento/[id]` - Relatório detalhado do evento
- `GET /api/relatorios/financeiro` - Relatório financeiro
- `GET /api/relatorios/exportar` - Exportar dados (CSV/JSON)

---

## Interfaces do Usuário

### 1. Página Inicial (`/`)
- Links para login de Pilotos e Administração
- Destaques das funcionalidades do sistema

### 2. Login (`/login`)
- Formulário de autenticação
- Redirecionamento baseado no role

### 3. Dashboard Admin (`/dashboard/admin`)
- **Métricas Gerais:**
  - Total de eventos, stakeholders, inscrições
  - Receita total
  - Status das inscrições (pendentes, aprovadas, rejeitadas)
- **Gráficos:**
  - Inscrições por dia (Line Chart)
  - Stakeholders por tipo (Pie Chart)
  - Receita por evento (Bar Chart)
- **Tabelas:**
  - Eventos mais populares
  - Receita por evento

### 4. Gestão de Eventos (`/dashboard/admin/eventos`)
- Lista de todos os eventos
- Ações: Editar, Relatório, Excluir
- Botão para criar novo evento
- Status badges (RASCUNHO, ATIVO, FINALIZADO)

### 5. Validações Financeiras (`/dashboard/admin/validacoes`)
- Lista de validações pendentes
- Visualização do comprovativo
- Ações: Aprovar, Rejeitar (com motivo)
- Informações do piloto e evento

### 6. Dashboard Piloto (`/dashboard/piloto`)
- **Resumo:**
  - Total de inscrições
  - Aprovadas e pendentes
- **Eventos Disponíveis:**
  - Cards com detalhes do evento
  - Botão para inscrever-se
- **Minhas Inscrições:**
  - Tabela com histórico
  - Status badges

### 7. Formulário de Inscrição (`/inscricao/[id]`)
- Detalhes do evento
- Seleção de categoria (com vagas disponíveis)
- Campos dinâmicos baseados na categoria
- Upload de comprovativo
- Termos e condições

---

## Relatórios e Estatísticas

### Dashboard API (`/api/relatorios/dashboard`)

**Métricas:**
- Total de eventos ativos
- Total de stakeholders
- Inscrições no período (configurável)
- Inscrições por status (pendentes, aprovadas, rejeitadas)
- Receita total
- Notificações enviadas
- Stakeholders ativos

**Gráficos:**
- Inscrições por dia (últimos 30 dias)
- Distribuição por tipo de stakeholder
- Eventos mais populares
- Receita por evento
- Taxa de aprovação por categoria

### Relatório Financeiro (`/api/relatorios/financeiro`)

**Dados:**
- Receita total por período
- Receita por evento
- Receita por categoria
- Receita mensal (últimos 12 meses)
- Taxa de conversão (inscrições → pagamentos)
- Validações pendentes (receita potencial)

### Relatório de Evento (`/api/relatorios/evento/[id]`)

**Estatísticas:**
- Total de inscrições
- Por status (aprovadas, pendentes, rejeitadas, canceladas)
- Receita estimada
- Vagas totais e ocupadas

**Distribuição:**
- Por categoria (vagas, ocupação, receita)
- Inscrições por status

### Exportação de Dados (`/api/relatorios/exportar`)

**Tipos:**
- Inscrições
- Eventos
- Stakeholders

**Formatos:**
- JSON
- CSV

---

## PWA Features

### Service Worker (`/public/sw.js`)
- Cache de recursos estáticos
- Network-first com fallback para cache
- Background sync preparado
- Limpeza automática de cache antigo

### Manifest (`/public/manifest.json`)
- Display mode: Standalone
- 8 tamanhos de ícones (72px a 512px)
- Atalhos para "Eventos" e "Minhas Inscrições"
- Screenshots para lojas
- Categorias: sports, productivity

### Componente de Instalação
- Botão flutuante customizado
- Detecção automática
- UX otimizada

### Meta Tags
- Apple Web App (iOS)
- Windows Tile
- Theme color consistente
- Viewport otimizado

---

## Segurança

### Autenticação
- NextAuth.js v5 com JWT
- Senhas hash com bcrypt (salt rounds: 10)
- Sessões com expiração configurável

### Autorização (RBAC)
- 5 níveis de permissão hierárquicos
- Middleware de proteção de rotas
- Verificação de permissões em APIs
- Admin não pode ver/gerenciar SuperAdmins

### Validação
- Zod schemas para todas as entradas
- Validação de tipos de arquivo (PDF/Imagens)
- Limite de tamanho (10MB)
- Sanitização de inputs

### Controle de Concorrência
- SELECT FOR UPDATE no Prisma
- Transações atômicas
- Verificação de vagas antes de aprovar
- Prevenção de race conditions

### HTTPS
- Obrigatório para PWA
- Vercel fornece HTTPS automático

---

## Instalação e Deploy

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+ (ou Vercel Postgres)
- npm ou yarn

### Instalação Local

```bash
# 1. Clonar o projeto
cd C:\Users\data entry 5\CascadeProjects\atcm-eventos

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# 4. Configurar banco de dados
npx prisma generate
npx prisma db push

# 5. Executar em desenvolvimento
npm run dev
```

### Criar Usuário SuperAdmin

```bash
# Via Prisma Studio
npx prisma studio
# Criar Stakeholder → Criar User com role SUPERADMIN

# Ou via script (scripts/seed.ts)
npx ts-node scripts/seed.ts
```

### Deploy no Vercel

```bash
# 1. Commit no GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/atcm-eventos.git
git push -u origin main

# 2. Importar no Vercel
# - Criar projeto no Vercel
# - Importar do GitHub
# - Configurar variáveis de ambiente
# - Deploy automático

# 3. Configurar Vercel Postgres
# - Adicionar Vercel Postgres no projeto
# - Copiar DATABASE_URL para variáveis de ambiente
# - Executar: npx prisma db push
```

### Variáveis de Ambiente

```env
DATABASE_URL="postgresql://user:password@localhost:5432/atcm_eventos"
NEXTAUTH_SECRET="gerar-um-secret-aleatorio"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="sua-chave-resend"
EMAIL_FROM="noreply@atcm-eventos.co.mz"
TWILIO_ACCOUNT_SID="seu-twilio-sid"
TWILIO_AUTH_TOKEN="seu-twilio-token"
TWILIO_PHONE_NUMBER="+258XXXXXXXXX"
BLOB_READ_WRITE_TOKEN="seu-token-vercel-blob"
MAX_FILE_SIZE="10485760"
```

---

## Estrutura do Projeto

```
atcm-eventos/
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   └── browserconfig.xml      # Windows tile config
├── src/
│   ├── app/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Autenticação
│   │   │   ├── eventos/       # Gestão de eventos
│   │   │   ├── inscricoes/    # Inscrições
│   │   │   ├── stakeholders/  # Stakeholders
│   │   │   ├── upload/        # Upload de arquivos
│   │   │   ├── users/         # Usuários
│   │   │   ├── validacoes/    # Validações
│   │   │   └── relatorios/    # Relatórios
│   │   ├── dashboard/
│   │   │   ├── admin/         # Dashboard admin
│   │   │   │   ├── page.tsx   # Dashboard principal
│   │   │   │   ├── eventos/   # Gestão de eventos
│   │   │   │   └── validacoes/ # Validações
│   │   │   └── piloto/        # Dashboard piloto
│   │   ├── inscricao/         # Formulário de inscrição
│   │   ├── login/             # Página de login
│   │   ├── layout.tsx         # Layout raiz
│   │   ├── page.tsx           # Página inicial
│   │   └── globals.css        # Estilos globais
│   ├── components/
│   │   └── PWAInstallPrompt.tsx
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── notifications.ts   # Sistema de notificações
│   │   ├── prisma.ts          # Cliente Prisma
│   │   ├── utils.ts           # Utilitários
│   │   └── validations.ts     # Schemas Zod
│   ├── middleware.ts          # Middleware de proteção
│   └── types/
│       └── index.ts           # Tipos TypeScript
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── vercel.json
├── README.md
├── INSTALL.md
└── PWA-GUIDE.md
```

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Gerar Prisma Client
npx prisma generate

# Push schema para o banco
npx prisma db push

# Abrir Prisma Studio
npx prisma studio

# Criar migration
npx prisma migrate dev --name nome-da-migration

# Lint
npm run lint
```

---

## Próximos Passos Sugeridos

1. **Ícones PWA:** Criar todos os ícones necessários (72px a 512px)
2. **Sincronização Offline:** Implementar IndexedDB + Background Sync
3. **Push Notifications:** Integrar Web Push API
4. **Testes:** Adicionar testes unitários e E2E
5. **CI/CD:** Configurar GitHub Actions
6. **Monitoramento:** Adicionar Sentry ou similar
7. **Analytics:** Integrar Google Analytics

---

## Suporte

Para dúvidas ou problemas:
- Consulte `INSTALL.md` para instalação
- Consulte `PWA-GUIDE.md` para PWA
- Consulte `README.md` para arquitetura

---

## Licença

Sistema desenvolvido para o Autódromo de Maputo (ATCM).
