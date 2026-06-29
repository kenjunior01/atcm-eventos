import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createEventSchema } from '@/lib/validations'
import { sendBulkNotification } from '@/lib/notifications'

/**
 * POST - Criar novo evento
 * Apenas SuperAdmin e Admin podem criar eventos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createEventSchema.parse(body)
    
    const { titulo, descricao, data, local, status, inscricoesAtivas, categories, requiredFields } = validatedData

    // TODO: Verificar permissão do usuário via session
    const createdById = 'USER_ID_FROM_SESSION' // Substituir por ID real do usuário

    const event = await prisma.$transaction(async (tx) => {
      // Criar evento
      const newEvent = await tx.event.create({
        data: {
          titulo,
          descricao,
          data: new Date(data),
          local,
          status,
          inscricoesAtivas,
          createdById,
        },
      })

      // Criar categorias
      const createdCategories = await Promise.all(
        categories.map((cat) =>
          tx.eventCategory.create({
            data: {
              eventId: newEvent.id,
              nome: cat.nome,
              descricao: cat.descricao,
              vagas: cat.vagas,
              taxaInscricao: cat.taxaInscricao,
            },
          })
        )
      )

      // Criar campos obrigatórios se fornecidos
      if (requiredFields && requiredFields.length > 0) {
        await Promise.all(
          requiredFields.map((field) =>
            tx.eventRequiredField.create({
              data: {
                eventId: newEvent.id,
                fieldName: field.fieldName,
                fieldLabel: field.fieldLabel,
                fieldType: field.fieldType,
                isRequired: field.isRequired,
                options: field.options,
              },
            })
          )
        )
      }

      return {
        ...newEvent,
        categories: createdCategories,
      }
    })

    // Enviar notificação em massa para stakeholders cadastrados
    try {
      await sendBulkNotification({
        type: 'EMAIL',
        stakeholderType: 'PILOTO', // Enviar apenas para pilotos
        subject: `Novo Evento: ${event.titulo}`,
        template: 'event-created',
        data: {
          eventName: event.titulo,
          eventDate: new Date(event.data).toLocaleDateString('pt-MZ'),
          eventLocation: event.local,
        },
      })

      // Log de notificação
      await prisma.notificationLog.create({
        data: {
          tipo: 'EMAIL',
          destinatario: 'PILOTOS',
          assunto: `Novo Evento: ${event.titulo}`,
          conteudo: `Novo evento criado: ${event.titulo}`,
          status: 'ENVIADO',
        },
      })
    } catch (notificationError) {
      console.error('Erro ao enviar notificações:', notificationError)
      // Não falhar a criação do evento se a notificação falhar
    }

    return NextResponse.json(
      {
        success: true,
        data: event,
        message: 'Evento criado com sucesso',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar evento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar evento',
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Listar eventos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}
    if (status) {
      where.status = status
    } else if (!includeInactive) {
      where.status = 'ATIVO'
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          categories: true,
          requiredFields: true,
          createdBy: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
        orderBy: { data: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao listar eventos:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao listar eventos',
      },
      { status: 500 }
    )
  }
}
