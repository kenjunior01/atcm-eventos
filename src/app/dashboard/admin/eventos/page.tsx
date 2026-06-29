'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EventosManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [eventos, setEventos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchEventos()
    }
  }, [session])

  const fetchEventos = async () => {
    try {
      const response = await fetch('/api/eventos')
      const data = await response.json()
      if (data.success) {
        setEventos(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return

    try {
      const response = await fetch(`/api/eventos/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchEventos()
      }
    } catch (error) {
      console.error('Erro ao excluir evento:', error)
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
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Eventos</h1>
              <p className="text-sm text-gray-600">Criar e gerenciar eventos</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/admin"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Voltar
              </Link>
              <Link
                href="/dashboard/admin/eventos/novo"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Novo Evento
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Evento</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Data</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Local</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Inscrições</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-gray-900">{evento.titulo}</p>
                      <p className="text-sm text-gray-600">{evento.descricao}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {new Date(evento.data).toLocaleDateString('pt-MZ')}
                  </td>
                  <td className="py-4 px-6">{evento.local}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        evento.status === 'ATIVO'
                          ? 'bg-green-100 text-green-800'
                          : evento.status === 'RASCUNHO'
                          ? 'bg-yellow-100 text-yellow-800'
                          : evento.status === 'FINALIZADO'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {evento.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">{evento._count?.registrations || 0}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/admin/eventos/${evento.id}`}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/dashboard/admin/eventos/${evento.id}/relatorio`}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        Relatório
                      </Link>
                      <button
                        onClick={() => handleDelete(evento.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
