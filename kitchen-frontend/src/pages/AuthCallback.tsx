import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/api'
import { startVmsSsoLogin } from '../lib/vms-sso'
import { setSession } from '../lib/auth-session'

/** Prevents React Strict Mode double-mount from consuming the one-time code twice. */
const inFlightCodes = new Set<string>()

function safeNext(raw: string | null): string {
  if (!raw?.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')?.trim()
    const next = safeNext(searchParams.get('next'))

    if (!code) {
      setError('رمز الدخول غير موجود. أعد المحاولة من صفحة تسجيل الدخول.')
      return
    }

    if (inFlightCodes.has(code)) {
      return
    }
    inFlightCodes.add(code)

    let cancelled = false

    ;(async () => {
      try {
        const response = await authService.exchangeVmsCode(code)
        if (!response.user) {
          throw new Error('missing user')
        }

        setSession(response.access_token, {
          user: response.user,
          is_staff: Boolean(response.is_staff),
          is_superadmin: Boolean(response.is_superadmin),
        })

        toast.success('تم تسجيل الدخول بنجاح')

        let destination = next
        if (destination.startsWith('/admin') && !response.is_staff) {
          destination = '/'
        } else if (destination === '/' && response.is_staff && next === '/') {
          // keep home for members; staff landing on bare callback without next stays home
          destination = '/'
        }

        navigate(destination, { replace: true })
      } catch (err: unknown) {
        inFlightCodes.delete(code)
        if (cancelled) return
        const axiosError = err as {
          response?: { data?: { message?: string }; status?: number }
        }
        const message = axiosError.response?.data?.message || 'فشل إكمال تسجيل الدخول'
        setError(message)
        toast.error(message)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="stars-bg"></div>
      <div className="card relative z-10 w-full max-w-md text-center space-y-4">
        {error ? (
          <>
            <p className="text-red-400">{error}</p>
            <div className="flex flex-col gap-3">
              <button type="button" className="btn-primary" onClick={() => startVmsSsoLogin()}>
                إعادة المحاولة عبر منصة الأعضاء
              </button>
              <Link to="/login" className="text-sm text-gray-400 hover:text-white">
                العودة لصفحة الدخول
              </Link>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin mx-auto" />
            <p className="text-gray-300">جاري إكمال تسجيل الدخول...</p>
          </>
        )}
      </div>
    </div>
  )
}
