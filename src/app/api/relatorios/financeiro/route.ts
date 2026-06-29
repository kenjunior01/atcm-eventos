import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Relatório Financeiro Completo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    const startDate = dataInicio ? new Date(dataInicio) : new Date(new Date().setMonth(new Date().getMonth() - 1))
    const endDate = dataFim ? new Date(dataFim) : new Date()

    // Receita total por período
    const receitaTotal = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COALESCE(SUM(ec."taxaInscricao"), 0) as total
      FROM "registrations" r
      JOIN "event_categories" ec ON r."categoryId" = ec.id
      WHERE r.status = 'APROVADO'
      AND r."createdAt" BETWEEN ${startDate} AND ${endDate}
    `

    // Receita por evento
    const receitaPorEvento = await prisma.$queryRaw<Array<any>>`
      SELECT 
        e.id,
        e.titulo as evento,
        e.data,
        COALESCE(SUM(ec."taxaInscricao"), 0) as receita,
        COUNT(r.id) as inscricoes_aprovadas,
        AVG(ec."taxaInscricao") as ticket_medio
      FROM "events" e
      LEFT JOIN "registrations" r ON e.id = r."eventId" AND r.status = 'APROVADO'
      LEFT JOIN "event_categories" ec ON r."categoryId" = ec.id
      WHERE e."createdAt" BETWEEN ${startDate} AND ${endDate}
      GROUP BY e.id, e.titulo, e.data
      ORDER BY receita DESC
    `

    // Receita por categoria
    const receitaPorCategoria = await prisma.$queryRaw<Array<any>>`
      SELECT 
        ec.nome as categoria,
        COALESCE(SUM(ec."taxaInscricao"), 0) as receita,
        COUNT(r.id) as inscricoes,
        AVG(ec."taxaInscricao") as ticket_medio
      FROM "event_categories" ec
      LEFT JOIN "registrations" r ON ec.id = r."categoryId" AND r.status = 'APROVADO'
      WHERE r."createdAt" BETWEEN ${startDate} AND ${endDate}
      GROUP BY ec.id, ec.nome
      ORDER BY receita DESC
    `

    // Receita mensal (últimos 12 meses)
    const receitaMensal = await prisma.$queryRaw<Array<any>>`
      SELECT 
        DATE_TRUNC('month', r."createdAt") as mes,
        COALESCE(SUM(ec."taxaInscricao"), 0) as receita,
        COUNT(r.id) as inscricoes
      FROM "registrations" r
      JOIN "event_categories" ec ON r."categoryId" = ec.id
      WHERE r.status = 'APROVADO'
      AND r."createdAt" >= DATE_TRUNC('month', NOW() - INTERVAL '12 months')
      GROUP BY DATE_TRUNC('month', r."createdAt")
      ORDER BY mes ASC
    `

    // Taxa de conversão (inscrições vs pagamentos aprovados)
    const taxaConversao = await prisma.$queryRaw<Array<any>>`
      SELECT 
        COUNT(*) as total_inscricoes,
        SUM(CASE WHEN status = 'APROVADO' THEN 1 ELSE 0 END) as aprovadas,
        ROUND(
          (SUM(CASE WHEN status = 'APROVADO' THEN 1 ELSE 0 END)::float / 
           NULLIF(COUNT(*), 0)) * 100, 
          2
        ) as taxa_conversao
      FROM "registrations"
      WHERE "createdAt" BETWEEN ${startDate} AND ${endDate}
    `

    // Validações pendentes (receita potencial)
    const validacoesPendentes = await prisma.$queryRaw<Array<any>>`
      SELECT 
        COUNT(r.id) as pendentes,
        COALESCE(SUM(ec."taxaInscricao"), 0) as receita_pendente
      FROM "registrations" r
      JOIN "event_categories" ec ON r."categoryId" = ec.id
      WHERE r.status = 'PENDENTE'
      AND r."createdAt" BETWEEN ${startDate} AND ${endDate}
    `

    return NextResponse.json({
      success: true,
      data: {
        periodo: {
          inicio: startDate.toISOString(),
          fim: endDate.toISOString(),
        },
        resumo: {
          receitaTotal: receitaTotal[0]?.total || 0,
          validacoesPendentes: validacoesPendentes[0]?.pendentes || 0,
          receitaPendente: validacoesPendentes[0]?.receita_pendente || 0,
          taxaConversao: taxaConversao[0]?.taxa_conversao || 0,
        },
        receitaPorEvento,
        receitaPorCategoria,
        receitaMensal,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar relatório financeiro',
      },
      { status: 500 }
    )
  }
}
