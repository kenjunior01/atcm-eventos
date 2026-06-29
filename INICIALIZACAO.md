# Inicialização do Sistema ATCM Eventos

## Passo 1: Configurar Banco de Dados PostgreSQL

### Opção A: Neon PostgreSQL (Gratuito e Recomendado)

1. Acesse https://neon.tech/signup
2. Crie uma conta gratuita
3. Crie um novo projeto PostgreSQL
4. Copie a **Connection String** fornecida
5. Cole no arquivo `.env` substituindo a URL existente:

```env
DATABASE_URL="postgresql://usuario:senha@host:porta/database?sslmode=require"
```

### Opção B: PostgreSQL Local

1. Instale PostgreSQL em https://www.postgresql.org/download/
2. Crie um banco de dados:
```bash
createdb atcm_eventos
```
3. Atualize o `.env`:
```env
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/atcm_eventos"
```

### Opção C: Vercel Postgres (para Deploy)

1. No projeto Vercel, adicione "Vercel Postgres"
2. Copie a **DATABASE_URL** das variáveis de ambiente
3. Cole no `.env` local

---

## Passo 2: Configurar Variáveis de Ambiente

O arquivo `.env` já está configurado com valores padrão. Verifique se está assim:

```env
# Database (Neon PostgreSQL gratuito - substitua pela sua URL)
DATABASE_URL="postgresql://neondb_owner:npg_YOUR_PASSWORD_HERE@ep-cool-mountain-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="atcm-eventos-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend) - Opcional para desenvolvimento
RESEND_API_KEY=""
EMAIL_FROM="noreply@atcm-eventos.co.mz"

# SMS (Twilio) - Opcional para desenvolvimento
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# File Upload - Vercel Blob (Opcional para desenvolvimento)
BLOB_READ_WRITE_TOKEN=""
MAX_FILE_SIZE=10485760
```

---

## Passo 3: Sincronizar Banco de Dados

Execute o comando para criar as tabelas:

```bash
npm run db:push
```

---

## Passo 4: Criar Usuário Inicial

Execute o script de seed para criar o usuário SuperAdmin:

```bash
npm run db:seed
```

Isso criará:
- **SuperAdmin**: admin@atcm.co.mz / admin123
- **Piloto de Exemplo**: piloto@exemplo.co.mz / piloto123

⚠️ **Importante**: Altere as senhas após o primeiro login!

---

## Passo 5: Iniciar o Servidor

```bash
npm run dev
```

O sistema estará disponível em http://localhost:3000

---

## Acesso ao Sistema

### Login SuperAdmin
- URL: http://localhost:3000/login
- Email: admin@atcm.co.mz
- Senha: admin123
- Dashboard: http://localhost:3000/dashboard/admin

### Login Piloto
- URL: http://localhost:3000/login
- Email: piloto@exemplo.co.mz
- Senha: piloto123
- Dashboard: http://localhost:3000/dashboard/piloto

---

## Prisma Studio (Interface Visual do Banco)

Para visualizar e editar dados diretamente:

```bash
npm run studio
```

Abra http://localhost:5555 no navegador.

---

## Troubleshooting

### Erro: "Can't reach database server"
- Verifique se a URL do DATABASE_URL está correta
- Verifique se o banco de dados está online (Neon)
- Verifique se PostgreSQL está rodando (local)

### Erro: "Prisma Client not generated"
```bash
npx prisma generate
```

### Erro: "Connection timeout"
- Verifique sua conexão com a internet
- Tente usar uma VPN se estiver em Moçambique

### Resetar Banco de Dados
```bash
npm run db:push -- --force-reset
npm run db:seed
```

---

## Próximos Passos

1. **Testar o sistema** - Faça login com o SuperAdmin
2. **Criar um evento** - Vá em Gestão de Eventos
3. **Criar categorias** - Adicione categorias ao evento
4. **Testar inscrição** - Use o usuário piloto
5. **Validar pagamento** - Aprove a inscrição no painel de validações

---

## Deploy no Vercel

1. Commit o código no GitHub
2. Importe o projeto no Vercel
3. Configure as variáveis de ambiente no Vercel
4. Deploy automático

Para mais detalhes, consulte `INSTALL.md` e `DOCUMENTACAO_COMPLETA.md`
