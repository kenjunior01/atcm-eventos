import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API de Relatórios e Estatísticas do Dashboard
 * Fornece métricas avançadas para gestão
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || '30' // dias
    const eventoId = searchParams.get('eventoId')

    const dias = parseInt(periodo)
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - dias)

    // Métricas gerais
    const [
      totalEventos,
      eventosAtivos,
      totalStakeholders,
      totalInscricoes,
      inscricoesPendentes,
      inscricoesAprovadas,
      inscricoesRejeitadas,
      receitaTotal,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: 'ATIVO' } }),
      prisma.stakeholder.count(),
      prisma.registration.count({ where: { createdAt: { gte: dataInicio } } }),
      prisma.registration.count({
        where: { status: 'PENDENTE', createdAt: { gte: dataInicio } },
      }),
      prisma.registration.count({
        where: { status: 'APROVADO', createdAt: { gte: dataInicio } },
      }),
      prisma.registration.count({
        where: { status: 'REJEITADO', createdAt: { gte: dataInicio } },
      }),
      prisma.$queryRaw<Array<{ total: number }>>`
        SELECT COALESCE(SUM(ec."taxaInscricao"), 0) as total
        FROM "registrations" r
        JOIN "event_categories" ec ON r."categoryId" = ec.id
        WHERE r.status = 'APROVADO'
        AND r."createdAt" >= ${dataInicio}
      `,
    ])

    // Inscrições por dia (últimos 30 dias)
    const inscricoesPorDia = await prisma.$queryRaw`
      SELECT 
        DATE(r."createdAt") as data,
        COUNT(*) as total,
        SUM(CASE WHEN r.status = 'APROVADO' THEN 1 ELSE 0 END) as aprovadas,
        SUM(CASE WHEN r.status = 'PENDENTE' THEN 1 ELSE 0 END) as pendentes
      FROM "registrations" r
      WHERE r."createdAt" >= ${dataInicio}
      GROUP BY DATE(r."createdAt")
      ORDER BY data ASC
    `

    // Distribuição por tipo de stakeholder
    const stakeholdersPorTipo = await prisma.stakeholder.groupBy({
      by: ['tipo'],
      _count: true,
    })

    // Eventos mais populares
    const eventosPopulares = await prisma.event.findMany({
      include: {
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: {
        registrations: {
          _count: 'desc',
        },
      },
      take: 5,
    })

    // Receita por evento
    const receitaPorEvento = await prisma.$queryRaw`
      SELECT 
        e.titulo as evento,
        e.data,
        COALESCE(SUM(ec."taxaInscricao"), 0) as receita,
        COUNT(r.id) as inscricoes_aprovadas
      FROM "events" e
      LEFT JOIN "registrations" r ON e.id = r."eventId" AND r.status = 'APROVADO'
      LEFT JOIN "event_categories" ec ON r."categoryId" = ec.id
      GROUP BY e.id, e.titulo, e.data
      ORDER BY receita DESC
      LIMIT 10
    `

    // Taxa de aprovação por categoria
    const taxaAprovacaoPorCategoria = await prisma.$queryRaw`
      SELECT 
        ec.nome as categoria,
        COUNT(r.id) as total_inscricoes,
        SUM(CASE WHEN r.status = 'APROVADO' THEN 1 ELSE 0 END) as aprovadas,
        ROUND(
          (SUM(CASE WHEN r.status = 'APROVADO' THEN 1 ELSE 0 END)::float / 
           NULLIF(COUNT(r.id), 0)) * 100, 
          2
        ) as taxa_aprovacao
      FROM "event_categories" ec
      LEFT JOIN "registrations" r ON ec.id = r."categoryId"
      GROUP BY ec.id, ec.nome
      HAVING COUNT(r.id) > 0
      ORDER BY taxa_aprovacao DESC
    `

    // Notificações enviadas
    const notificacoesEnviadas = await prisma.notificationLog.count({
      where: {
        enviadoAt: { gte: dataInicio },
        status: 'ENVIADO',
      },
    })

    // Stakeholders ativos (com inscrições recentes)
    const stakeholdersAtivos = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COUNT(DISTINCT "stakeholderId") as total
      FROM "registrations"
      WHERE "createdAt" >= ${dataInicio}
    `

    return NextResponse.json({
      success: true,
      data: {
        periodo: `${dias} dias`,
        dataInicio: dataInicio.toISOString(),
        metricasGerais: {
          totalEventos,
          eventosAtivos,
          totalStakeholders,
          totalInscricoes,
          inscricoesPendentes,
          inscricoesAprovadas,
          inscricoesRejeitadas,
          receitaTotal: receitaTotal[0]?.total || 0,
          notificacoesEnviadas,
          stakeholdersAtivos: stakeholdersAtivos[0]?.total || 0,
        },
        inscricoesPorDia,
        stakeholdersPorTipo,
        eventosPopulares,
        receitaPorEvento,
        taxaAprovacaoPorCategoria,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar relatório',
      },
      { status: 500 }
    )
  }
}
