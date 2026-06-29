import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET - Obter detalhes de um stakeholder
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stakeholder = await prisma.stakeholder.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            lastLogin: true,
          },
        },
        registrations: {
          include: {
            event: true,
            category: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    })

    if (!stakeholder) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stakeholder não encontrado',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: stakeholder,
    })
  } catch (error) {
    console.error('Erro ao obter stakeholder:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao obter stakeholder',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Atualizar stakeholder
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { nome, email, telefone, nif, endereco, tipo } = body

    const stakeholder = await prisma.stakeholder.update({
      where: { id: params.id },
      data: {
        nome,
        email,
        telefone,
        nif,
        endereco,
        tipo,
      },
    })

    return NextResponse.json({
      success: true,
      data: stakeholder,
      message: 'Stakeholder atualizado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao atualizar stakeholder:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar stakeholder',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Deletar stakeholder
 * Apenas SuperAdmin pode deletar
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.stakeholder.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Stakeholder deletado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao deletar stakeholder:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao deletar stakeholder',
      },
      { status: 500 }
    )
  }
}
