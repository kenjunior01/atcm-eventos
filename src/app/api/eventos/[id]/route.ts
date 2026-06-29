import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateEventSchema } from '@/lib/validations'

/**
 * GET - Obter detalhes de um evento específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        categories: {
          include: {
            _count: {
              select: {
                registrations: {
                  where: { status: 'APROVADO' },
                },
              },
            },
          },
        },
        requiredFields: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        registrations: {
          include: {
            stakeholder: true,
            category: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: 'Evento não encontrado',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error('Erro ao obter evento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao obter evento',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Atualizar evento
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateEventSchema.parse(body)
    
    const { id, ...updateData } = validatedData

    // Verificar se o evento existe
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!existingEvent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Evento não encontrado',
        },
        { status: 404 }
      )
    }

    // Atualizar evento
    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        titulo: updateData.titulo,
        descricao: updateData.descricao,
        data: updateData.data ? new Date(updateData.data) : undefined,
        local: updateData.local,
        status: updateData.status,
        inscricoesAtivas: updateData.inscricoesAtivas,
      },
      include: {
        categories: true,
        requiredFields: true,
      },
    })

    // Se houver categorias para atualizar, deletar e recriar
    if (updateData.categories) {
      await prisma.eventCategory.deleteMany({
        where: { eventId: params.id },
      })

      await Promise.all(
        updateData.categories.map((cat) =>
          prisma.eventCategory.create({
            data: {
              eventId: params.id,
              nome: cat.nome,
              descricao: cat.descricao,
              vagas: cat.vagas,
              taxaInscricao: cat.taxaInscricao,
            },
          })
        )
      )
    }

    // Se houver campos obrigatórios para atualizar, deletar e recriar
    if (updateData.requiredFields) {
      await prisma.eventRequiredField.deleteMany({
        where: { eventId: params.id },
      })

      await Promise.all(
        updateData.requiredFields.map((field) =>
          prisma.eventRequiredField.create({
            data: {
              eventId: params.id,
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

    // Enviar notificação se o evento foi ativado
    if (updateData.inscricoesAtivas === true && !existingEvent.inscricoesAtivas) {
      try {
        const { sendBulkNotification } = await import('@/lib/notifications')
        await sendBulkNotification({
          type: 'EMAIL',
          stakeholderType: 'PILOTO',
          subject: `Inscrições Abertas: ${event.titulo}`,
          template: 'event-created',
          data: {
            eventName: event.titulo,
            eventDate: new Date(event.data).toLocaleDateString('pt-MZ'),
            eventLocation: event.local,
          },
        })
      } catch (notificationError) {
        console.error('Erro ao enviar notificações:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      data: event,
      message: 'Evento atualizado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao atualizar evento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar evento',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Deletar evento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.event.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Evento deletado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao deletar evento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao deletar evento',
      },
      { status: 500 }
    )
  }
}
