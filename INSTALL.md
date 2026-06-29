# Guia de Instalação - ATCM Eventos

## Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+ (ou Vercel Postgres)
- npm ou yarn
- Conta no Vercel (para deploy)

## Instalação Local

### 1. Clonar o projeto

```bash
cd C:\Users\data entry 5\CascadeProjects\atcm-eventos
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/atcm_eventos"

# NextAuth
NEXTAUTH_SECRET="gerar-um-secret-aleatorio-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend) - Opcional
RESEND_API_KEY="sua-chave-resend"
EMAIL_FROM="noreply@atcm-eventos.co.mz"

# SMS (Twilio) - Opcional
TWILIO_ACCOUNT_SID="seu-twilio-sid"
TWILIO_AUTH_TOKEN="seu-twilio-token"
TWILIO_PHONE_NUMBER="+258XXXXXXXXX"

# File Upload (Vercel Blob) - Opcional para local
BLOB_READ_WRITE_TOKEN="seu-token-vercel-blob"
```

**Gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Configurar Banco de Dados

#### Opção A: PostgreSQL Local

1. Crie o banco de dados:
```sql
CREATE DATABASE atcm_eventos;
```

2. Execute as migrations:
```bash
npx prisma generate
npx prisma db push
```

#### Opção B: Vercel Postgres

1. Crie um projeto no Vercel
2. Adicione o Vercel Postgres
3. Copie a `DATABASE_URL` do Vercel para o `.env`
4. Execute:
```bash
npx prisma generate
npx prisma db push
```

### 5. Executar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## Deploy no Vercel

### 1. Preparar para Deploy

#### Adicionar dependência do tailwindcss-animate

```bash
npm install tailwindcss-animate
```

#### Configurar Vercel Blob (para uploads)

1. No dashboard do Vercel, vá em Settings > Environment Variables
2. Adicione a variável `BLOB_READ_WRITE_TOKEN`
3. No projeto, adicione ao `package.json`:
```json
{
  "dependencies": {
    "@vercel/blob": "^1.0.0"
  }
}
```

### 2. Push para GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/atcm-eventos.git
git push -u origin main
```

### 3. Importar no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Importe do GitHub
4. Configure as variáveis de ambiente no Vercel
5. Deploy automático

### 4. Configurar Banco no Vercel

1. No projeto Vercel, vá em Storage
2. Adicione "Postgres"
3. O Vercel fornecerá a `DATABASE_URL`
4. Execute o comando de push do schema:
```bash
npx prisma db push
```

## Criar Usuário Inicial (SuperAdmin)

Após configurar o banco, crie o primeiro usuário:

### Via Prisma Studio (interativo)

```bash
npx prisma studio
```

Abra http://localhost:5555 e:
1. Crie um `Stakeholder` primeiro
2. Crie um `User` com role `SUPERADMIN`

### Via Script (recomendado)

Crie o arquivo `scripts/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Criar stakeholder
  const stakeholder = await prisma.stakeholder.create({
    data: {
      nome: 'Super Admin',
      email: 'admin@atcm.co.mz',
      telefone: '+258840000000',
      tipo: 'COLABORADOR',
    },
  })

  // Criar usuário superadmin
  const passwordHash = await bcrypt.hash('senha123', 10)
  const user = await prisma.user.create({
    data: {
      email: 'admin@atcm.co.mz',
      passwordHash,
      role: 'SUPERADMIN',
      stakeholderId: stakeholder.id,
    },
  })

  console.log('SuperAdmin criado:', user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Execute:
```bash
npx ts-node scripts/seed.ts
```

## Estrutura do Projeto

```
atcm-eventos/
├── prisma/
│   └── schema.prisma          # Schema do banco de dados
├── src/
│   ├── app/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Autenticação
│   │   │   ├── eventos/       # Gestão de eventos
│   │   │   ├── inscricoes/    # Inscrições
│   │   │   ├── stakeholders/  # Stakeholders
│   │   │   ├── upload/        # Upload de arquivos
│   │   │   ├── users/         # Usuários
│   │   │   └── validacoes/    # Validações
│   │   ├── login/             # Página de login
│   │   ├── layout.tsx         # Layout raiz
│   │   ├── page.tsx           # Página inicial
│   │   └── globals.css        # Estilos globais
│   ├── lib/
│   │   ├── auth.ts            # Configuração NextAuth
│   │   ├── notifications.ts   # Sistema de notificações
│   │   ├── prisma.ts          # Cliente Prisma
│   │   ├── utils.ts           # Utilitários
│   │   └── validations.ts     # Schemas Zod
│   ├── middleware.ts          # Middleware de proteção
│   └── types/
│       └── index.ts           # Tipos TypeScript
├── public/
│   └── manifest.json          # PWA manifest
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── vercel.json
```

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

## Solução de Problemas

### Erro: Cannot find module

Execute:
```bash
npm install
```

### Erro: Prisma Client not generated

Execute:
```bash
npx prisma generate
```

### Erro: Database connection failed

Verifique se o PostgreSQL está rodando e se a `DATABASE_URL` está correta no `.env`.

### Upload de arquivos não funciona

Certifique-se de configurar o Vercel Blob e adicionar a variável `BLOB_READ_WRITE_TOKEN`.

## Próximos Passos

1. Criar painel admin completo
2. Criar formulário de inscrição
3. Implementar dashboard para pilotos
4. Adicionar testes
5. Configurar CI/CD

## Suporte

Para dúvidas ou problemas, consulte a documentação oficial:
- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Vercel](https://vercel.com/docs)
