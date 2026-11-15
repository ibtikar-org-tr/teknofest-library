import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/api'
import { startVmsSsoLogin } from '../lib/vms-sso'

/** Prevents React Strict Mode double-mount from consuming the one-time code twice. */
const inFlightCodes = new Set<string>()

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')?.trim()
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
        localStorage.setItem('admin_token', response.access_token)
        toast.success('تم تسجيل الدخول بنجاح')
        navigate('/admin', { replace: true })
      } catch (err: unknown) {
        inFlightCodes.delete(code)
        if (cancelled) return
        const axiosError = err as {
          response?: { data?: { message?: string; code?: string }; status?: number }
        }
        const message =
          axiosError.response?.data?.message ||
          (axiosError.response?.data?.code === 'NOT_KITCHEN_STAFF'
            ? 'حسابك غير مصرح له بدخول لوحة المطبخ'
            : 'فشل إكمال تسجيل الدخول')
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
              <Link to="/admin/login" className="text-sm text-gray-400 hover:text-white">
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
