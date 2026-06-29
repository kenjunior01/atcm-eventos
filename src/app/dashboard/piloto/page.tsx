'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PilotoDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [inscricoes, setInscricoes] = useState<any[]>([])
  const [eventosDisponiveis, setEventosDisponiveis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDados()
    }
  }, [session])

  const fetchDados = async () => {
    try {
      const [inscricoesRes, eventosRes] = await Promise.all([
        fetch('/api/inscricoes'),
        fetch('/api/eventos?status=ATIVO'),
      ])

      const inscricoesData = await inscricoesRes.json()
      const eventosData = await eventosRes.json()

      if (inscricoesData.success) {
        setInscricoes(inscricoesData.data)
      }
      if (eventosData.success) {
        setEventosDisponiveis(eventosData.data)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Piloto</h1>
              <p className="text-sm text-gray-600">Gerencie suas inscrições</p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-sm text-gray-600 mb-1">Total de Inscrições</p>
            <p className="text-3xl font-bold text-gray-900">{inscricoes.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Aprovadas</p>
            <p className="text-3xl font-bold text-gray-900">
              {inscricoes.filter((i) => i.status === 'APROVADO').length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Pendentes</p>
            <p className="text-3xl font-bold text-gray-900">
              {inscricoes.filter((i) => i.status === 'PENDENTE').length}
            </p>
          </div>
        </div>

        {/* Eventos Disponíveis */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Eventos Disponíveis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventosDisponiveis.map((evento) => (
              <div key={evento.id} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {evento.titulo}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{evento.descricao}</p>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{new Date(evento.data).toLocaleDateString('pt-MZ')}</span>
                  <span>{evento.local}</span>
                </div>
                <Link
                  href={`/inscricao/${evento.id}`}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Inscrever-se
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Minhas Inscrições */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Minhas Inscrições</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Evento</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Categoria</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Data</th>
                </tr>
              </thead>
              <tbody>
                {inscricoes.map((inscricao) => (
                  <tr key={inscricao.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6">{inscricao.event.titulo}</td>
                    <td className="py-4 px-6">{inscricao.category.nome}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          inscricao.status === 'APROVADO'
                            ? 'bg-green-100 text-green-800'
                            : inscricao.status === 'PENDENTE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : inscricao.status === 'REJEITADO'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {inscricao.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {new Date(inscricao.createdAt).toLocaleDateString('pt-MZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {inscricoes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">Nenhuma inscrição realizada</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
