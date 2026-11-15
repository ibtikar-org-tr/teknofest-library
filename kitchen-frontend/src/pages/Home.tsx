import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Loader2, LogIn, Rocket, Sparkles } from 'lucide-react'
import { kitchensService } from '../services/api'
import type { KitchenEvent } from '../types'
import { isLoggedIn } from '../lib/auth-session'

export default function Home() {
  const [kitchens, setKitchens] = useState<KitchenEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loggedIn = isLoggedIn()

  useEffect(() => {
    if (!loggedIn) return
    let cancelled = false
    setLoading(true)
    kitchensService
      .list()
      .then((data) => {
        if (!cancelled) setKitchens(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'تعذر تحميل المطابخ')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loggedIn])

  return (
    <div className="relative">
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teknofest-orange/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-teknofest-cyan/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teknofest-orange/20 border border-teknofest-orange/30 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-teknofest-orange" />
            <span className="text-teknofest-orange font-medium">مطابخ مرتبطة بفعاليات VMS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            مطبخ تكنوفيست
            <span className="block text-transparent bg-clip-text bg-gradient-to-l from-teknofest-orange to-teknofest-cyan">
              مع ابتكار
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            كل مطبخ مرتبط بفعالية في VMS. سجّل دخولك ثم ادخل مطبخ الفعالية التي أنت مسجّل فيها.
          </p>

          {!loggedIn ? (
            <Link
              to="/login"
              className="btn-primary inline-flex items-center justify-center gap-2 text-lg"
            >
              <LogIn className="w-5 h-5" />
              دخول عبر VMS
            </Link>
          ) : null}
        </div>
      </section>

      {loggedIn ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="flex items-center gap-3 mb-8">
            <Calendar className="w-6 h-6 text-teknofest-cyan" />
            <h2 className="text-2xl font-bold text-white">مطابخ الفعاليات المتاحة لك</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-400 text-center py-8">{error}</p>
          ) : kitchens.length === 0 ? (
            <div className="text-center py-16 text-gray-400 border border-teknofest-light-blue/20 rounded-2xl">
              لا توجد مطابخ متاحة بعد، أو لم تُسجَّل في أي فعالية لديها مطبخ.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kitchens.map((kitchen) => (
                <Link
                  key={kitchen.id}
                  to={`/events/${kitchen.id}`}
                  className="group block p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-orange/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-teknofest-orange transition-colors">
                      {kitchen.name}
                    </h3>
                    <Rocket className="w-5 h-5 text-teknofest-cyan shrink-0" />
                  </div>
                  {kitchen.description ? (
                    <p className="text-gray-400 text-sm line-clamp-3 mb-4">{kitchen.description}</p>
                  ) : (
                    <p className="text-gray-500 text-sm mb-4">مطبخ هذه الفعالية</p>
                  )}
                  <span className="text-teknofest-cyan text-sm font-medium">ادخل المطبخ ←</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
