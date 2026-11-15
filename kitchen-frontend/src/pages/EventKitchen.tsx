import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, FileText, Loader2, Trophy, User, Users } from 'lucide-react'
import { kitchensService } from '../services/api'
import type { KitchenEvent } from '../types'

export default function EventKitchen() {
  const { eventId = '' } = useParams()
  const [event, setEvent] = useState<KitchenEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    setLoading(true)
    kitchensService
      .get(eventId)
      .then((data) => {
        if (!cancelled) setEvent(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'تعذر فتح مطبخ هذه الفعالية')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-red-400 mb-6">{error || 'المطبخ غير متاح'}</p>
        <Link to="/" className="text-teknofest-cyan hover:underline">
          العودة للقائمة
        </Link>
      </div>
    )
  }

  const actions = [
    {
      to: `/events/${eventId}/register/team`,
      title: 'تسجيل كفريق',
      description: 'أنشئ فريقاً ضمن هذه الفعالية',
      icon: Users,
    },
    {
      to: `/events/${eventId}/register/individual`,
      title: 'انضم / تسجيل فردي',
      description: 'سجّل فردياً للانضمام لفريق',
      icon: User,
    },
    {
      to: `/events/${eventId}/project/submit`,
      title: 'تقديم مشروع',
      description: 'قدّم مشروع فريقك لهذه الفعالية',
      icon: FileText,
    },
    {
      to: `/events/${eventId}/top-teams`,
      title: 'أفضل الفرق',
      description: 'ترتيب الفرق في هذه الفعالية',
      icon: Trophy,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8">
        <ArrowRight className="w-4 h-4" />
        كل المطابخ
      </Link>

      <div className="mb-10">
        <p className="text-teknofest-cyan text-sm mb-2">مطبخ الفعالية</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{event.name}</h1>
        {event.description ? (
          <p className="text-gray-400 max-w-2xl">{event.description}</p>
        ) : null}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.to}
              to={action.to}
              className="p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-orange/40 transition-all"
            >
              <Icon className="w-8 h-8 text-teknofest-orange mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">{action.title}</h2>
              <p className="text-gray-400 text-sm">{action.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
