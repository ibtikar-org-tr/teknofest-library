import { Link } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import Logo from '../../components/Logo'
import { startVmsSsoLogin } from '../../lib/vms-sso'

export default function AdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="stars-bg"></div>

      <Link
        to="/"
        className="absolute top-6 right-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors z-20"
      >
        <span>العودة للرئيسية</span>
        <ArrowLeft className="w-4 h-4" />
      </Link>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">لوحة الإدارة</h1>
          <p className="text-gray-400">سجّل الدخول عبر منصة أعضاء إبتكار للوصول إلى المطبخ</p>
        </div>

        <div className="card fade-in space-y-6">
          <p className="text-sm leading-7 text-gray-300 text-center">
            سيتم توجيهك إلى منصة الأعضاء. بعد تسجيل الدخول ستُعاد إلى لوحة إدارة المطبخ تلقائياً.
          </p>

          <button
            type="button"
            onClick={() => startVmsSsoLogin()}
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
