import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET - Obter detalhes de uma inscrição específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const registration = await prisma.registration.findUnique({
      where: { id: params.id },
      include: {
        event: true,
        category: true,
        stakeholder: true,
        paymentProof: true,
        validation: {
          include: {
            validatedBy: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          error: 'Inscrição não encontrada',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error('Erro ao obter inscrição:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao obter inscrição',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Atualizar inscrição (cancelar, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, motivoRejeicao } = body

    const registration = await prisma.registration.update({
      where: { id: params.id },
      data: {
        status: status || undefined,
        motivoRejeicao: motivoRejeicao || undefined,
      },
      include: {
        event: true,
        category: true,
        stakeholder: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error('Erro ao atualizar inscrição:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar inscrição',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remover inscrição
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.registration.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Inscrição removida com sucesso',
    })
  } catch (error) {
    console.error('Erro ao remover inscrição:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao remover inscrição',
      },
      { status: 500 }
    )
  }
}
