'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ValidacoesFinanceiras() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [validacoes, setValidacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchValidacoes()
    }
  }, [session])

  const fetchValidacoes = async () => {
    try {
      const response = await fetch('/api/validacoes?status=PENDENTE')
      const data = await response.json()
      if (data.success) {
        setValidacoes(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar validações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleValidar = async (id: string, aprovado: boolean, motivo?: string) => {
    try {
      const response = await fetch('/api/validacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: id,
          aprovado,
          motivo: motivo || '',
        }),
      })

      if (response.ok) {
        fetchValidacoes()
      }
    } catch (error) {
      console.error('Erro ao validar:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Validações Financeiras</h1>
              <p className="text-sm text-gray-600">Aprovar ou rejeitar inscrições</p>
            </div>
            <Link
              href="/dashboard/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Voltar
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Piloto</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Evento</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Categoria</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Valor</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Comprovativo</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Data</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody>
              {validacoes.map((validacao) => (
                <tr key={validacao.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {validacao.stakeholder.nome}
                      </p>
                      <p className="text-sm text-gray-600">{validacao.stakeholder.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">{validacao.event.titulo}</td>
                  <td className="py-4 px-6">{validacao.category.nome}</td>
                  <td className="py-4 px-6">
                    MZN {validacao.category.taxaInscricao.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <a
                      href={validacao.paymentProof.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Ver comprovativo
                    </a>
                  </td>
                  <td className="py-4 px-6">
                    {new Date(validacao.createdAt).toLocaleDateString('pt-MZ')}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleValidar(validacao.id, true)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => {
                          const motivo = prompt('Motivo da rejeição:')
                          if (motivo) handleValidar(validacao.id, false, motivo)
                        }}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {validacoes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhuma validação pendente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
