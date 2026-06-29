import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { uploadPaymentProofSchema } from '@/lib/validations'

/**
 * API Route para upload de comprovativo de pagamento
 * 
 * Usa Vercel Blob para armazenamento de arquivos
 * Suporta PDF e imagens (JPEG, PNG)
 * Tamanho máximo: 10MB
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const registrationId = formData.get('registrationId') as string
    const file = formData.get('file') as File

    if (!registrationId || !file) {
      return NextResponse.json(
        {
          success: false,
          error: 'registrationId e file são obrigatórios',
        },
        { status: 400 }
      )
    }

    // Validar arquivo
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'Arquivo deve ter no máximo 10MB',
        },
        { status: 400 }
      )
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Apenas PDF ou imagens (JPEG, PNG) são permitidos',
        },
        { status: 400 }
      )
    }

    // Verificar se a inscrição existe
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
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

    // Verificar se já existe comprovativo
    const existingProof = await prisma.paymentProof.findUnique({
      where: { registrationId },
    })

    if (existingProof) {
      // Deletar arquivo antigo do Vercel Blob
      try {
        await fetch(existingProof.fileUrl, { method: 'DELETE' })
      } catch (error) {
        console.error('Erro ao deletar arquivo antigo:', error)
      }

      // Deletar registro do banco
      await prisma.paymentProof.delete({
        where: { registrationId },
      })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `comprovativo-${registrationId}-${timestamp}.${extension}`

    // Upload para Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
    })

    // Salvar no banco de dados
    const paymentProof = await prisma.paymentProof.create({
      data: {
        registrationId,
        fileName: file.name,
        fileUrl: blob.url,
        fileSize: file.size,
        mimeType: file.type,
      },
      include: {
        registration: {
          include: {
            event: true,
            stakeholder: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: paymentProof,
        message: 'Comprovativo enviado com sucesso',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao fazer upload do comprovativo',
      },
      { status: 500 }
    )
  }
}
