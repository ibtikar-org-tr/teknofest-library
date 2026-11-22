import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import Logo from '../components/Logo'
import { startVmsSsoLogin } from '../lib/vms-sso'
import { isLoggedIn, isStaffSession } from '../lib/auth-session'
import { Navigate } from 'react-router-dom'

function safeNext(raw: string | null): string {
  if (!raw?.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export default function Login() {
  const [searchParams] = useSearchParams()
  const next = safeNext(searchParams.get('next'))

  if (isLoggedIn()) {
    if (next.startsWith('/admin') && !isStaffSession()) {
      return <Navigate to="/" replace />
    }
    return <Navigate to={next || '/'} replace />
  }

  return (
    <div className="min-h-[100dvh] min-h-screen flex items-center justify-center px-4 py-16 sm:py-10 relative">
      <div className="stars-bg"></div>

      <Link
        to="/"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 min-h-11 inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors z-20"
      >
        <span>العودة للرئيسية</span>
        <ArrowLeft className="w-4 h-4" />
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">تسجيل الدخول</h1>
          <p className="text-gray-400">
            سجّل الدخول عبر منصة أعضاء إبتكار للوصول إلى مطبخ تكنوفيست
          </p>
        </div>

        <div className="card fade-in space-y-6">
          <p className="text-sm leading-7 text-gray-300 text-center">
            أي عضو يمكنه الدخول لتعبئة النماذج. الإداريون يصلون أيضاً إلى لوحة الإدارة بعد
            تسجيل الدخول.
          </p>

          <button
            type="button"
            onClick={() => startVmsSsoLogin(next)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            تسجيل الدخول عبر منصة الأعضاء
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          © {new Date().getFullYear()} تكنوفيست - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  )
}
