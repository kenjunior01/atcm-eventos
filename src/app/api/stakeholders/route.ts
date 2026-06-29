import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createStakeholderSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

/**
 * POST - Criar novo stakeholder
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createStakeholderSchema.parse(body)

    // Verificar se email já existe
    const existing = await prisma.stakeholder.findUnique({
      where: { email: validatedData.email },
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

    // Criar stakeholder
    const stakeholder = await prisma.stakeholder.create({
      data: validatedData,
    })

    return NextResponse.json(
      {
        success: true,
        data: stakeholder,
        message: 'Stakeholder criado com sucesso',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar stakeholder:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar stakeholder',
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Listar stakeholders
 * Apenas SuperAdmin e Admin podem listar todos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    const where: any = {}
    if (tipo) {
      where.tipo = tipo
    }
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [stakeholders, total] = await Promise.all([
      prisma.stakeholder.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stakeholder.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: stakeholders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao listar stakeholders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao listar stakeholders',
      },
      { status: 500 }
    )
  }
}
