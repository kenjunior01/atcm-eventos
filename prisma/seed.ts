import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar stakeholder SuperAdmin
  const stakeholder = await prisma.stakeholder.upsert({
    where: { email: 'admin@atcm.co.mz' },
    update: {},
    create: {
      nome: 'Administrador ATCM',
      email: 'admin@atcm.co.mz',
      telefone: '+258841234567',
      tipo: 'COLABORADOR',
    },
  })

  console.log('✅ Stakeholder criado:', stakeholder.email)

  // Hash da senha
  const passwordHash = await bcrypt.hash('admin123', 10)

  // Criar usuário SuperAdmin
  const user = await prisma.user.upsert({
    where: { email: 'admin@atcm.co.mz' },
    update: {},
    create: {
      email: 'admin@atcm.co.mz',
      passwordHash,
      role: 'SUPERADMIN',
      stakeholderId: stakeholder.id,
      isActive: true,
    },
  })

  console.log('✅ Usuário SuperAdmin criado:', user.email)
  console.log('📧 Email: admin@atcm.co.mz')
  console.log('🔑 Senha: admin123')
  console.log('⚠️  Altere a senha após o primeiro login!')

  // Criar stakeholder piloto de exemplo
  const pilotStakeholder = await prisma.stakeholder.upsert({
    where: { email: 'piloto@exemplo.co.mz' },
    update: {},
    create: {
      nome: 'João Piloto',
      email: 'piloto@exemplo.co.mz',
      telefone: '+258847654321',
      tipo: 'PILOTO',
    },
  })

  console.log('✅ Stakeholder Piloto criado:', pilotStakeholder.email)

  // Criar usuário piloto
  const pilotPasswordHash = await bcrypt.hash('piloto123', 10)
  const pilotUser = await prisma.user.upsert({
    where: { email: 'piloto@exemplo.co.mz' },
    update: {},
    create: {
      email: 'piloto@exemplo.co.mz',
      passwordHash: pilotPasswordHash,
      role: 'STAFF',
      stakeholderId: pilotStakeholder.id,
      isActive: true,
    },
  })

  console.log('✅ Usuário Piloto criado:', pilotUser.email)
  console.log('📧 Email: piloto@exemplo.co.mz')
  console.log('🔑 Senha: piloto123')

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
