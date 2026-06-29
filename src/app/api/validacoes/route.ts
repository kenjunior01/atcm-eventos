import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validatePaymentSchema } from '@/lib/validations'
import { sendNotification } from '@/lib/notifications'

/**
 * API Route para validação de comprovativos de pagamento
 * 
 * Apenas usuários com roles FINANCEIRO ou VALIDADOR_PAGAMENTO podem acessar
 * Implementa aprovação/rejeição com notificação automática
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autorização (middleware deve validar role)
    const body = await request.json()
    
    const validatedData = validatePaymentSchema.parse(body)
    const { registrationId, aprovado, motivo } = validatedData

    // Iniciar transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verificar se a inscrição existe
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        include: {
          event: true,
          category: true,
          stakeholder: true,
          paymentProof: true,
          validation: true,
        },
      })

      if (!registration) {
        throw new Error('Inscrição não encontrada')
      }

      // 2. Verificar se já foi validada
      if (registration.validation) {
        throw new Error('Esta inscrição já foi validada')
      }

      // 3. Verificar se há comprovativo
      if (!registration.paymentProof) {
        throw new Error('Nenhum comprovativo de pagamento encontrado')
      }

      // 4. Se aprovado, verificar vagas novamente (race condition protection)
      if (aprovado) {
        const categoryWithLock = await tx.$queryRaw<Array<{ vagas: number }>>`
          SELECT "vagas" 
          FROM "event_categories" 
          WHERE "id" = ${registration.categoryId}
          FOR UPDATE
        `

        const approvedCount = await tx.registration.count({
          where: {
            categoryId: registration.categoryId,
            status: 'APROVADO',
          },
        })

        const availableSlots = registration.category.vagas - approvedCount
        if (availableSlots <= 0) {
          throw new Error('Não há vagas disponíveis nesta categoria')
        }
      }

      // 5. Criar validação
      const validation = await tx.paymentValidation.create({
        data: {
          registrationId,
          validatedById: 'USER_ID_FROM_SESSION', // TODO: Obter do session
          aprovado,
          motivo: aprovado ? null : motivo,
        },
      })

      // 6. Atualizar status da inscrição
      const updatedRegistration = await tx.registration.update({
        where: { id: registrationId },
        data: {
          status: aprovado ? 'APROVADO' : 'REJEITADO',
          motivoRejeicao: aprovado ? null : motivo,
        },
        include: {
          event: true,
          category: true,
          stakeholder: true,
          paymentProof: true,
          validation: true,
        },
      })

      return updatedRegistration
    })

    // Enviar notificação após transação bem-sucedida
    try {
      await sendNotification({
        type: 'EMAIL',
        recipient: result.stakeholder.email,
        subject: aprovado 
          ? `Inscrição Aprovada - ${result.event.titulo}`
          : `Inscrição Rejeitada - ${result.event.titulo}`,
        template: aprovado ? 'registration-approved' : 'registration-rejected',
        data: {
          eventName: result.event.titulo,
          category: result.category.nome,
          motivo: motivo,
        },
      })

      // Log de notificação
      await prisma.notificationLog.create({
        data: {
          tipo: 'EMAIL',
          destinatario: result.stakeholder.email,
          assunto: aprovado 
            ? `Inscrição Aprovada - ${result.event.titulo}`
            : `Inscrição Rejeitada - ${result.event.titulo}`,
          conteudo: aprovado 
            ? 'Sua inscrição foi aprovada com sucesso'
            : `Sua inscrição foi rejeitada. Motivo: ${motivo}`,
          status: 'ENVIADO',
        },
      })
    } catch (notificationError) {
      console.error('Erro ao enviar notificação:', notificationError)
      // Não falhar a requisição se a notificação falhar
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: aprovado 
          ? 'Inscrição aprovada com sucesso'
          : 'Inscrição rejeitada',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao validar pagamento:', error)

    if (error instanceof Error) {
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
        error: 'Erro ao validar pagamento',
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Listar inscrições pendentes de validação
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDENTE'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where: {
          status: status as any,
          paymentProof: {
            isNot: null,
          },
          validation: null,
        },
        include: {
          event: true,
          category: true,
          stakeholder: true,
          paymentProof: true,
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.registration.count({
        where: {
          status: status as any,
          paymentProof: {
            isNot: null,
          },
          validation: null,
        },
      }),
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
    console.error('Erro ao listar validações pendentes:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao listar validações pendentes',
      },
      { status: 500 }
    )
  }
}
