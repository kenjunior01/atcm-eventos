'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/relatorios/dashboard?periodo=30')
      const data = await response.json()
      if (data.success) {
        setDashboardData(data.data)
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Erro ao carregar dashboard</p>
      </div>
    )
  }

  const { metricasGerais, inscricoesPorDia, stakeholdersPorTipo, eventosPopulares, receitaPorEvento } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
              <p className="text-sm text-gray-600">Visão geral do sistema</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session?.user?.email}
              </span>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Eventos"
            value={metricasGerais.totalEventos}
            icon="📅"
            color="blue"
          />
          <MetricCard
            title="Stakeholders"
            value={metricasGerais.totalStakeholders}
            icon="👥"
            color="green"
          />
          <MetricCard
            title="Inscrições (30 dias)"
            value={metricasGerais.totalInscricoes}
            icon="📝"
            color="purple"
          />
          <MetricCard
            title="Receita Total"
            value={`MZN ${metricasGerais.receitaTotal.toLocaleString()}`}
            icon="💰"
            color="yellow"
          />
        </div>

        {/* Status das Inscrições */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatusCard
            title="Pendentes"
            value={metricasGerais.inscricoesPendentes}
            color="yellow"
          />
          <StatusCard
            title="Aprovadas"
            value={metricasGerais.inscricoesAprovadas}
            color="green"
          />
          <StatusCard
            title="Rejeitadas"
            value={metricasGerais.inscricoesRejeitadas}
            color="red"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Inscrições por Dia */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Inscrições por Dia
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inscricoesPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#2563eb" name="Total" />
                <Line type="monotone" dataKey="aprovadas" stroke="#22c55e" name="Aprovadas" />
                <Line type="monotone" dataKey="pendentes" stroke="#f59e0b" name="Pendentes" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stakeholders por Tipo */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Stakeholders por Tipo
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stakeholdersPorTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.tipo}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="_count"
                >
                  {stakeholdersPorTipo.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Eventos Populares */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Eventos Mais Populares
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Evento</th>
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-left py-3 px-4">Inscrições</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {eventosPopulares.map((evento: any) => (
                  <tr key={evento.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{evento.titulo}</td>
                    <td className="py-3 px-4">
                      {new Date(evento.data).toLocaleDateString('pt-MZ')}
                    </td>
                    <td className="py-3 px-4">{evento._count.registrations}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          evento.status === 'ATIVO'
                            ? 'bg-green-100 text-green-800'
                            : evento.status === 'RASCUNHO'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {evento.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receita por Evento */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Receita por Evento
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={receitaPorEvento}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="evento" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="receita" fill="#2563eb" name="Receita (MZN)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`text-3xl ${colorClasses[color as keyof typeof colorClasses]} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatusCard({ title, value, color }: any) {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
  }

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} rounded-xl border p-6`}>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
