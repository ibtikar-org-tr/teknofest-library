import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, FileText, Loader2, Star, UserPlus, Users } from 'lucide-react'
import { kitchensService } from '../services/api'
import type { KitchenEvent, Team } from '../types'

type Action = {
  to: string
  title: string
  description: string
  icon: typeof Users
}

export default function EventKitchen() {
  const { eventId = '' } = useParams()
  const [event, setEvent] = useState<KitchenEvent | null>(null)
  const [myTeam, setMyTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    setLoading(true)
    Promise.all([kitchensService.get(eventId), kitchensService.getMyTeam(eventId)])
      .then(([eventData, team]) => {
        if (cancelled) return
        setEvent(eventData)
        setMyTeam(team)
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

  const actions: Action[] = [
    ...(myTeam
      ? [
          {
            to: `/events/${eventId}/project/submit`,
            title: 'التقديم مع الفريق',
            description: `قدّم مشروع فريق «${myTeam.team_name}» لهذه الفعالية`,
            icon: FileText,
          },
        ]
      : [
          {
            to: `/events/${eventId}/register/team`,
            title: 'إنشاء فريق',
            description: 'أسّس فريقاً جديداً ضمن هذه الفعالية',
            icon: Users,
          },
          {
            to: `/events/${eventId}/join-team`,
            title: 'الانضمام لفريق',
            description: 'انضم لفريق موجود ما زال فيه أماكن شاغرة',
            icon: UserPlus,
          },
        ]),
    ...(event.is_jury
      ? [
          {
            to: `/events/${eventId}/jury`,
            title: 'تحكيم المشاريع',
            description: 'قيّم الفرق المعيّنة لك كمحكم',
            icon: Star,
          },
        ]
      : []),
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
        {myTeam ? (
          <p className="text-sm text-teknofest-orange mt-3">
            أنت عضو في فريق: {myTeam.team_name}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-3">
            أنشئ فريقاً أو انضم لفريق أولاً — بعدها يمكنك التقديم بالمشروع.
          </p>
        )}
      </div>

      <div className={`grid gap-5 ${actions.length > 1 ? 'sm:grid-cols-2' : 'max-w-md'}`}>
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
