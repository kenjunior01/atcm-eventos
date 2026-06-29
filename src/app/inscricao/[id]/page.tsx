'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function InscricaoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [evento, setEvento] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [camposDinamicos, setCamposDinamicos] = useState<Record<string, string>>({})
  const [comprovativo, setComprovativo] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchEvento()
    }
  }, [session, params.id])

  const fetchEvento = async () => {
    try {
      const response = await fetch(`/api/eventos/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setEvento(data.data)
        setCategorias(data.data.categories || [])
      }
    } catch (error) {
      console.error('Erro ao buscar evento:', error)
      setError('Erro ao carregar evento')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!categoriaSelecionada) {
      setError('Selecione uma categoria')
      setSubmitting(false)
      return
    }

    if (!comprovativo) {
      setError('Faça upload do comprovativo de pagamento')
      setSubmitting(false)
      return
    }

    try {
      // Upload do comprovativo
      const formData = new FormData()
      formData.append('file', comprovativo)
      formData.append('registrationId', 'temp')

      const uploadResponse = await fetch('/api/upload/comprovativo', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Erro ao fazer upload')
      }

      // Criar inscrição
      const inscricaoResponse = await fetch('/api/inscricoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: params.id,
          categoryId: categoriaSelecionada,
          camposPersonalizados: camposDinamicos,
          paymentProofId: uploadData.data.id,
        }),
      })

      const inscricaoData = await inscricaoResponse.json()

      if (!inscricaoResponse.ok) {
        throw new Error(inscricaoData.error || 'Erro ao criar inscrição')
      }

      router.push('/dashboard/piloto')
    } catch (error: any) {
      setError(error.message || 'Erro ao realizar inscrição')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Evento não encontrado</p>
      </div>
    )
  }

  const categoria = categorias.find((c) => c.id === categoriaSelecionada)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{evento.titulo}</h1>
          <p className="text-sm text-gray-600">{evento.descricao}</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Formulário de Inscrição</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações do Evento */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Detalhes do Evento</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Data</p>
                    <p className="font-medium">{new Date(evento.data).toLocaleDateString('pt-MZ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Local</p>
                    <p className="font-medium">{evento.local}</p>
                  </div>
                </div>
              </div>

              {/* Seleção de Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={categoriaSelecionada}
                  onChange={(e) => setCategoriaSelecionada(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome} - MZN {cat.taxaInscricao.toLocaleString()} ({cat.vagas - cat._count?.registrations || cat.vagas} vagas disponíveis)
                    </option>
                  ))}
                </select>
              </div>

              {/* Campos Dinâmicos */}
              {categoria?.camposObrigatorios && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Informações Adicionais</h3>
                  {JSON.parse(categoria.camposObrigatorios).map((campo: any) => (
                    <div key={campo.nome} className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {campo.label} *
                      </label>
                      {campo.tipo === 'text' && (
                        <input
                          type="text"
                          required
                          onChange={(e) =>
                            setCamposDinamicos({
                              ...camposDinamicos,
                              [campo.nome]: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      )}
                      {campo.tipo === 'number' && (
                        <input
                          type="number"
                          required
                          onChange={(e) =>
                            setCamposDinamicos({
                              ...camposDinamicos,
                              [campo.nome]: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      )}
                      {campo.tipo === 'select' && (
                        <select
                          required
                          onChange={(e) =>
                            setCamposDinamicos({
                              ...camposDinamicos,
                              [campo.nome]: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          <option value="">Selecione</option>
                          {campo.opcoes?.map((opcao: string) => (
                            <option key={opcao} value={opcao}>
                              {opcao}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload de Comprovativo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprovativo de Pagamento * (PDF ou Imagem, máx 10MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setComprovativo(e.target.files?.[0] || null)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {categoria && (
                  <p className="mt-2 text-sm text-gray-600">
                    Valor a pagar: MZN {categoria.taxaInscricao.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Termos */}
              <div>
                <label className="flex items-center">
                  <input type="checkbox" required className="mr-2" />
                  <span className="text-sm text-gray-600">
                    Concordo com os termos e condições do evento
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Enviando...' : 'Confirmar Inscrição'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
