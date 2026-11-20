import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Loader2, Trophy, Users } from 'lucide-react'
import { kitchensService } from '../services/api'
import type { KitchenEvent, Team } from '../types'
import { isLoggedIn } from '../lib/auth-session'

export default function EventKitchen() {
  const { eventId = '' } = useParams()
  const [event, setEvent] = useState<KitchenEvent | null>(null)
  const [myTeam, setMyTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loggedIn = isLoggedIn()

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      kitchensService.get(eventId),
      loggedIn ? kitchensService.getMyTeam(eventId).catch(() => null) : Promise.resolve(null),
    ])
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
  }, [eventId, loggedIn])

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
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
          <p className="text-sm text-teknofest-orange mt-3">فريقك: {myTeam.team_name}</p>
        ) : null}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Link
          to={`/events/${eventId}/leaderboard`}
          className="p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-orange/40 transition-all"
        >
          <Trophy className="w-8 h-8 text-teknofest-orange mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">لوحة المتصدرين</h2>
          <p className="text-gray-400 text-sm">أسماء الفرق وعدد الأعضاء</p>
        </Link>
        <Link
          to={
            loggedIn
              ? `/events/${eventId}/my-team`
              : `/login?next=${encodeURIComponent(`/events/${eventId}/my-team`)}`
          }
          className="p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-cyan/40 transition-all"
        >
          <Users className="w-8 h-8 text-teknofest-cyan mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">فريقي</h2>
          <p className="text-gray-400 text-sm">
            {myTeam ? 'عرض فريقك وتقديم المشروع' : 'إنشاء فريق أو الانضمام'}
          </p>
        </Link>
      </div>
    </div>
  )
}
