import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API de Exportação de Dados
 * Suporta CSV e JSON
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'inscricoes' // inscricoes, eventos, stakeholders
    const formato = searchParams.get('formato') || 'json' // json, csv
    const eventoId = searchParams.get('eventoId')

    let dados: any = []
    let nomeArquivo = ''

    if (tipo === 'inscricoes') {
      const where: any = {}
      if (eventoId) where.eventId = eventoId

      dados = await prisma.registration.findMany({
        where,
        include: {
          event: { select: { titulo: true, data: true } },
          stakeholder: { select: { nome: true, email: true, telefone: true } },
          category: { select: { nome: true, taxaInscricao: true } },
          paymentProof: { select: { fileUrl: true, uploadedAt: true } },
          validation: { select: { aprovado: true, motivo: true, validatedAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      nomeArquivo = `inscricoes_${new Date().toISOString().split('T')[0]}`
    } else if (tipo === 'eventos') {
      dados = await prisma.event.findMany({
        include: {
          categories: true,
          _count: {
            select: { registrations: true },
          },
        },
        orderBy: { data: 'desc' },
      })

      nomeArquivo = `eventos_${new Date().toISOString().split('T')[0]}`
    } else if (tipo === 'stakeholders') {
      dados = await prisma.stakeholder.findMany({
        include: {
          _count: {
            select: { registrations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      nomeArquivo = `stakeholders_${new Date().toISOString().split('T')[0]}`
    }

    if (formato === 'csv') {
      const csv = converterParaCSV(dados)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${nomeArquivo}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: dados,
      metadados: {
        tipo,
        formato,
        dataExportacao: new Date().toISOString(),
        totalRegistros: dados.length,
      },
    })
  } catch (error) {
    console.error('Erro ao exportar dados:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao exportar dados',
      },
      { status: 500 }
    )
  }
}

function converterParaCSV(dados: any[]): string {
  if (dados.length === 0) return ''

  // Extrair cabeçalhos
  const cabecalhos = Object.keys(dados[0]).filter(
    (key) => typeof dados[0][key] !== 'object'
  )

  // Criar linha de cabeçalho
  const linhaCabecalho = cabecalhos.join(',')

  // Criar linhas de dados
  const linhas = dados.map((item) => {
    return cabecalhos
      .map((cabecalho) => {
        const valor = item[cabecalho]
        if (valor === null || valor === undefined) return ''
        if (typeof valor === 'string') return `"${valor.replace(/"/g, '""')}"`
        return valor
      })
      .join(',')
  })

  return [linhaCabecalho, ...linhas].join('\n')
}
