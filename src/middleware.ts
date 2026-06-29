import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const session = await auth()
  const token = session?.user
  const isAuth = !!token
  const pathname = req.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/login')
  const isAdminPage = pathname.startsWith('/admin')
  const isFinanceiroPage = pathname.startsWith('/validacoes')

  // Redirecionar para login se não autenticado
  if (!isAuth && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirecionar para dashboard se já autenticado e tentar acessar login
  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Verificar permissões para rotas de admin
  if (isAdminPage && isAuth) {
    const role = token.role as string
    if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Verificar permissões para rotas de validação
  if (isFinanceiroPage && isAuth) {
    const role = token.role as string
    if (role !== 'SUPERADMIN' && role !== 'ADMIN' && role !== 'FINANCEIRO' && role !== 'VALIDADOR_PAGAMENTO') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/validacoes/:path*',
    '/login',
  ],
}
