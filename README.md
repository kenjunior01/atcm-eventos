# Sistema de Gestão de Eventos ATCM

Sistema de gestão de eventos de desporto motorizado (Drifts, Corridas, etc.) realizado no ATCM em Maputo. PWA altamente responsivo para PC e Mobile, focado em performance extrema para aguentar picos de acessos.

## 🏗️ Arquitetura da Stack

### Frontend
- **Next.js 14** (App Router) - Framework React com SSR/SSG para performance
- **TypeScript** - Type safety e melhor DX
- **TailwindCSS** - Styling utility-first
- **shadcn/ui** - Componentes UI modernos e acessíveis
- **React Hook Form** - Gestão de formulários performática
- **Zod** - Validação de schemas

### Backend
- **Next.js API Routes** - Serverless functions otimizadas
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Banco de dados relacional robusto
- **NextAuth.js v5** - Autenticação moderna com RBAC

### Serviços Externos
- **Vercel Blob** - Storage de arquivos (comprovativos de pagamento)
- **Resend** - Envio de emails transacionais
- **Twilio** - Envio de SMS

### Performance
- **Edge Runtime** - Para APIs que não precisam de Node.js
- **Server Actions** - Reduz latency de requests
- **Prisma Connection Pooling** - Otimizado para alta concorrência
- **PostgreSQL Indexes** - Índices compostos para queries críticas
- **Caching Strategy** - Redis opcional para cache de dados frequentes

## 📁 Estrutura de Pastas

```
atcm-eventos/
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   │   ├── eventos/
│   │   │   │   ├── stakeholders/
│   │   │   │   └── validacoes/
│   │   │   └── piloto/
│   │   │       ├── inscricoes/
│   │   │       └── perfil/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── eventos/
│   │   │   ├── inscricoes/
│   │   │   └── upload/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── admin/
│   │   ├── piloto/
│   │   └── shared/
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # NextAuth config
│   │   ├── validations.ts     # Zod schemas
│   │   ├── notifications.ts   # Email/SMS services
│   │   └── utils.ts
│   ├── middleware.ts          # RBAC middleware
│   └── types/
│       └── index.ts
├── public/
└── package.json
```

## 🗄️ Modelagem do Banco de Dados

### Tabelas Principais

#### **Stakeholders** (Base de dados centralizada)
- Armazena todos os tipos de stakeholders: Clientes, Pilotos, Fornecedores, Patrocinadores, Colaboradores
- Campos: nome, email, telefone, nif, endereco, tipo (enum)
- Índices: email (unique), tipo

#### **Users** (Autenticação)
- Relacionado com Stakeholder (opcional)
- Roles: SUPERADMIN, ADMIN, STAFF, FINANCEIRO, VALIDADOR_PAGAMENTO
- O Admin não pode ver/gerenciar SuperAdmins
- Índices: email (unique), role

#### **Events**
- Status: RASCUNHO, ATIVO, ENCERRADO, CANCELADO
- Campo `inscricoesAtivas` para controlar formulário
- Relacionado com User (creator)
- Índices: data, status, inscricoesAtivas

#### **EventCategories**
- Categorias por evento (ex: Tração Traseira, Geral)
- Vagas limitadas por categoria
- Taxa de inscrição por categoria
- Índice: eventId

#### **Registrations**
- Status: PENDENTE, APROVADO, REJEITADO, CANCELADO
- Unique constraint: (eventId, stakeholderId)
- Índices compostos: eventId, stakeholderId, status, categoryId
- Dados extra em JSON (flexível para campos dinâmicos)

#### **PaymentProof**
- Upload de comprovativos (PDF/Imagem)
- Armazenado no Vercel Blob
- Índice: registrationId (unique)

#### **PaymentValidation**
- Validação por usuário autorizado
- Aprovação/Rejeição com motivo
- Índices: registrationId, validatedById

### Estratégias de Performance

1. **Controle de Concorrência**: Uso de `SELECT FOR UPDATE` no Prisma para prevenir race conditions em inscrições
2. **Índices Compostos**: Otimizados para queries frequentes (ex: inscrições por evento e status)
3. **Connection Pooling**: Configuração do Prisma para alta concorrência
4. **Edge Caching**: Cache de dados estáticos na Edge do Vercel

## 🔐 Sistema de Autenticação e Autorização (RBAC)

### Roles e Permissões

| Role | Permissões |
|------|------------|
| **SUPERADMIN** | Gestão total do sistema, incluindo outros SuperAdmins |
| **ADMIN** | Gestão operacional de eventos, stakeholders, validações (não vê SuperAdmins) |
| **STAFF** | Visualização limitada, edição de eventos |
| **FINANCEIRO** | Validação de comprovativos de pagamento |
| **VALIDADOR_PAGAMENTO** | Aprovação/Rejeição de inscrições |

### Middleware de Proteção
- Verifica role do usuário antes de acessar rotas
- Redireciona para login se não autenticado
- Bloqueia acesso a rotas não autorizadas

## 📡 Sistema de Notificações

### Tipos de Notificação
- **Email**: Via Resend (templates HTML)
- **SMS**: Via Twilio
- **Push**: Opcional (Web Push API)

### Gatilhos Automáticos
1. Novo evento criado/editado → Alerta em massa para stakeholders cadastrados
2. Inscrição aprovada → Confirmação para piloto
3. Inscrição rejeitada → Notificação com motivo

### Logs
- Tabela `NotificationLog` rastreia todos os envios
- Status: ENVIADO, FALHOU, PENDENTE

## 🚀 Deploy no Vercel

### Pré-requisitos
1. Configurar variáveis de ambiente no Vercel
2. Configurar Vercel Postgres ou PostgreSQL externo
3. Configurar Vercel Blob para uploads

### Comandos
```bash
# Instalar dependências
npm install

# Gerar Prisma Client
npx prisma generate

# Push do schema para o banco
npx prisma db push

# Build
npm run build

# Deploy automático via Git
git push origin main
```

## 📱 PWA Features

- Manifest.json para instalação
- Service Worker para offline
- Responsive design (Mobile First)
- Touch-optimized UI

## 🔒 Segurança

- Passwords hasheados com bcrypt
- CSRF protection via NextAuth
- Rate limiting em APIs críticas
- Validação de inputs com Zod
- File upload restrictions (tipo e tamanho)

## 📊 Monitoramento

- Vercel Analytics
- Error tracking (Sentry opcional)
- Logs de notificações

## 🧪 Testes

- Unit tests com Jest
- E2E tests com Playwright
- Load tests para picos de inscrição

## 📝 Licença

Propriedade do ATCM - Maputo
