import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Relatório detalhado de um evento específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const evento = await prisma.event.findUnique({
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
        registrations: {
          include: {
            stakeholder: true,
            category: true,
            paymentProof: true,
            validation: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!evento) {
      return NextResponse.json(
        {
          success: false,
          error: 'Evento não encontrado',
        },
        { status: 404 }
      )
    }

    // Estatísticas do evento
    const estatisticas = {
      totalInscricoes: evento.registrations.length,
      aprovadas: evento.registrations.filter((r) => r.status === 'APROVADO').length,
      pendentes: evento.registrations.filter((r) => r.status === 'PENDENTE').length,
      rejeitadas: evento.registrations.filter((r) => r.status === 'REJEITADO').length,
      canceladas: evento.registrations.filter((r) => r.status === 'CANCELADO').length,
      receitaEstimada: evento.categories.reduce(
        (acc, cat) => acc + cat.taxaInscricao * cat._count.registrations,
        0
      ),
      vagasTotais: evento.categories.reduce((acc, cat) => acc + cat.vagas, 0),
      vagasOcupadas: evento.categories.reduce(
        (acc, cat) => acc + cat._count.registrations,
        0
      ),
    }

    // Distribuição por categoria
    const distribuicaoPorCategoria = evento.categories.map((cat) => ({
      categoria: cat.nome,
      vagas: cat.vagas,
      vagasOcupadas: cat._count.registrations,
      vagasDisponiveis: cat.vagas - cat._count.registrations,
      taxaOcupacao: ((cat._count.registrations / cat.vagas) * 100).toFixed(1),
      receita: cat.taxaInscricao * cat._count.registrations,
    }))

    // Inscrições por status
    const inscricoesPorStatus = {
      PENDENTE: evento.registrations.filter((r) => r.status === 'PENDENTE'),
      APROVADO: evento.registrations.filter((r) => r.status === 'APROVADO'),
      REJEITADO: evento.registrations.filter((r) => r.status === 'REJEITADO'),
      CANCELADO: evento.registrations.filter((r) => r.status === 'CANCELADO'),
    }

    return NextResponse.json({
      success: true,
      data: {
        evento,
        estatisticas,
        distribuicaoPorCategoria,
        inscricoesPorStatus,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar relatório do evento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar relatório do evento',
      },
      { status: 500 }
    )
  }
}
