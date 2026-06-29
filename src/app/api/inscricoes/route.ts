import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRegistrationSchema } from '@/lib/validations'
import { z } from 'zod'

/**
 * API Route para criação de inscrição
 * 
 * Esta rota implementa controle de concorrência usando SELECT FOR UPDATE
 * para prevenir race conditions quando múltiplos usuários tentam se inscrever
 * simultaneamente nas últimas vagas de um evento.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar input
    const validatedData = createRegistrationSchema.parse(body)
    const { eventId, stakeholderId, categoryId, dadosExtra } = validatedData

    // Iniciar transação com controle de concorrência
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verificar se o evento existe e está ativo para inscrições
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: { categories: true },
      })

      if (!event) {
        throw new Error('Evento não encontrado')
      }

      if (!event.inscricoesAtivas) {
        throw new Error('Inscrições não estão ativas para este evento')
      }

      // 2. Verificar se a categoria existe
      const category = event.categories.find((c) => c.id === categoryId)
      if (!category) {
        throw new Error('Categoria não encontrada')
      }

      // 3. Verificar se o stakeholder existe
      const stakeholder = await tx.stakeholder.findUnique({
        where: { id: stakeholderId },
      })

      if (!stakeholder) {
        throw new Error('Stakeholder não encontrado')
      }

      // 4. Verificar se o stakeholder já está inscrito neste evento
      const existingRegistration = await tx.registration.findUnique({
        where: {
          eventId_stakeholderId: {
            eventId,
            stakeholderId,
          },
        },
      })

      if (existingRegistration) {
        throw new Error('Você já está inscrito neste evento')
      }

      // 5. CONTROLE DE CONCORRÊNCIA: Lock na categoria para verificar vagas
      // Usamos SELECT FOR UPDATE para bloquear a linha durante a transação
      const categoryWithLock = await tx.$queryRaw<Array<{ vagas: number }>>`
        SELECT "vagas" 
        FROM "event_categories" 
        WHERE "id" = ${categoryId}
        FOR UPDATE
      `

      if (!categoryWithLock || categoryWithLock.length === 0) {
        throw new Error('Categoria não encontrada')
      }

      // 6. Contar inscrições aprovadas nesta categoria
      const approvedCount = await tx.registration.count({
        where: {
          categoryId,
          status: 'APROVADO',
        },
      })

      // 7. Verificar se há vagas disponíveis
      const availableSlots = category.vagas - approvedCount
      if (availableSlots <= 0) {
        throw new Error('Não há vagas disponíveis nesta categoria')
      }

      // 8. Criar a inscrição
      const registration = await tx.registration.create({
        data: {
          eventId,
          stakeholderId,
          categoryId,
          status: 'PENDENTE',
          dadosExtra: dadosExtra || {},
        },
        include: {
          event: true,
          category: true,
          stakeholder: true,
        },
      })

      return registration
    }, {
      // Configurações de timeout e isolamento para performance
      maxWait: 5000, // Tempo máximo para esperar por uma transação
      timeout: 10000, // Tempo máximo para executar a transação
      isolationLevel: 'ReadCommitted', // Isolamento adequado para concorrência
    })

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Inscrição criada com sucesso. Aguardando validação do comprovativo.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar inscrição:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validação falhou',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      // Tratar erros específicos de concorrência
      if (error.message.includes('vagas') || error.message.includes('já está inscrito')) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 } // Conflict
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Listar inscrições (com filtros)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const stakeholderId = searchParams.get('stakeholderId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (eventId) where.eventId = eventId
    if (stakeholderId) where.stakeholderId = stakeholderId
    if (status) where.status = status

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        include: {
          event: true,
          category: true,
          stakeholder: true,
          paymentProof: true,
          validation: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.registration.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: registrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao listar inscrições:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao listar inscrições',
      },
      { status: 500 }
    )
  }
}
