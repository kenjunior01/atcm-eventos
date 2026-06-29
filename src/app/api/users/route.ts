import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerUserSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'
import { canManageUser } from '@/lib/auth'

/**
 * POST - Criar novo usuário (admin/staff)
 * Apenas SuperAdmin pode criar outros SuperAdmins
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerUserSchema.parse(body)
    
    const { email, password, stakeholderId, role } = validatedData

    // TODO: Verificar permissão do criador via session
    const creatorRole = 'SUPERADMIN' // Substituir por role real do usuário

    // Verificar permissão para criar usuário com role especificada
    if (!canManageUser(creatorRole as any, role as any)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sem permissão para criar usuário com este nível de acesso',
        },
        { status: 403 }
      )
    }

    // Verificar se email já existe
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email já cadastrado',
        },
        { status: 409 }
      )
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        stakeholderId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        stakeholderId: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: user,
        message: 'Usuário criado com sucesso',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar usuário',
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Listar usuários
 * Apenas SuperAdmin pode ver todos, Admin não vê SuperAdmins
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // TODO: Verificar role do usuário via session
    const currentUserRole = 'ADMIN' // Substituir por role real

    const where: any = {}
    if (role) {
      where.role = role
    }

    // Admin não pode ver SuperAdmins
    if (currentUserRole === 'ADMIN') {
      where.role = { not: 'SUPERADMIN' }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          stakeholderId: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          stakeholder: {
            select: {
              id: true,
              nome: true,
              tipo: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao listar usuários',
      },
      { status: 500 }
    )
  }
}
