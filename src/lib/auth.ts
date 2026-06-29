import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais inválidas')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { stakeholder: true },
        })

        if (!user || !user.isActive) {
          throw new Error('Usuário não encontrado ou inativo')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error('Senha incorreta')
        }

        // Atualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          stakeholderId: user.stakeholderId,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.stakeholderId = user.stakeholderId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.stakeholderId = token.stakeholderId as string | null
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

/**
 * Verificar permissões baseadas em role
 */
export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    SUPERADMIN: 5,
    ADMIN: 4,
    FINANCEIRO: 3,
    VALIDADOR_PAGAMENTO: 2,
    STAFF: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Verificar se usuário pode gerenciar outro usuário
 * Admin não pode gerenciar SuperAdmin
 */
export function canManageUser(
  managerRole: Role,
  targetRole: Role
): boolean {
  if (managerRole === 'SUPERADMIN') return true
  if (managerRole === 'ADMIN' && targetRole !== 'SUPERADMIN') return true
  return false
}
