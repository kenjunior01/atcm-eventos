import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              ATCM Eventos
            </h1>
            <p className="text-xl text-gray-600">
              Sistema de Gestão de Eventos de Desporto Motorizado
            </p>
            <p className="text-lg text-gray-500 mt-2">
              Autódromo de Maputo
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Link
              href="/login"
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">🏎️</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Pilotos
              </h2>
              <p className="text-gray-600">
                Inscreva-se em eventos de drift e corridas
              </p>
            </Link>

            <Link
              href="/login"
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">⚙️</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Administração
              </h2>
              <p className="text-gray-600">
                Gerencie eventos, inscrições e validações
              </p>
            </Link>
          </div>

          <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Recursos do Sistema
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Gestão de Eventos
                  </h4>
                  <p className="text-sm text-gray-600">
                    Crie e gerencie eventos com categorias e vagas limitadas
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Inscrições Online
                  </h4>
                  <p className="text-sm text-gray-600">
                    Sistema de inscrição com upload de comprovativos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Validação Financeira
                  </h4>
                  <p className="text-sm text-gray-600">
                    Fluxo completo de aprovação de pagamentos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Notificações
                  </h4>
                  <p className="text-sm text-gray-600">
                    Alertas automáticos por email e SMS
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Base de Dados Centralizada
                  </h4>
                  <p className="text-sm text-gray-600">
                    Gestão de pilotos, fornecedores e patrocinadores
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Controle de Acesso
                  </h4>
                  <p className="text-sm text-gray-600">
                    Múltiplos níveis de permissão (RBAC)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
