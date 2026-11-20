import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, FileText, Loader2, UserPlus, Users } from 'lucide-react'
import { kitchensService } from '../services/api'
import type { Team } from '../types'

export default function MyTeam() {
  const { eventId = '' } = useParams()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    setLoading(true)
    kitchensService
      .getMyTeam(eventId)
      .then((data) => {
        if (!cancelled) setTeam(data)
      })
      .catch((err) => {
        if (!cancelled && err.response?.status !== 404) {
          setError(err.response?.data?.message || 'تعذر تحميل بيانات فريقك')
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

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-red-400 mb-6">{error}</p>
        <Link to={`/events/${eventId}/dashboard`} className="text-teknofest-cyan hover:underline">
          لوحتي
        </Link>
      </div>
    )
  }

  if (team) {
    const members = team.members ?? []
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link
        to={`/events/${eventId}`}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowRight className="w-4 h-4" />
        المطبخ
      </Link>

      <div>
        <p className="text-teknofest-cyan text-sm mb-2">لوحتي · فريقي</p>
          <h1 className="text-3xl font-bold text-white mb-2">{team.team_name}</h1>
          <p className="text-gray-400 text-sm">{team.field}</p>
        </div>

        <div className="card space-y-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-teknofest-orange" />
            الأعضاء ({members.length})
          </h2>
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id ?? m.email}
                className="flex justify-between gap-3 text-sm py-2 border-b border-teknofest-light-blue/10 last:border-0"
              >
                <span className="text-white">
                  {m.full_name}
                  {m.is_leader ? (
                    <span className="text-teknofest-orange text-xs mr-2"> (قائد)</span>
                  ) : null}
                </span>
                <span className="text-gray-500 truncate">{m.email}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          to={`/events/${eventId}/project/submit`}
          className="card flex items-center gap-4 hover:border-teknofest-orange/40 border border-transparent transition-all"
        >
          <FileText className="w-10 h-10 text-teknofest-orange shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-white">تقديم مشروع الفريق</h2>
            <p className="text-gray-400 text-sm">أرسل أو حدّث مشروع «{team.team_name}»</p>
          </div>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link
        to={`/events/${eventId}`}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowRight className="w-4 h-4" />
        المطبخ
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">لوحتي</h1>
        <p className="text-gray-400">لست في فريق بعد. أنشئ فريقاً أو انضم لأحد المسارين.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Link
          to={`/events/${eventId}/register/team`}
          className="p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-orange/40 transition-all"
        >
          <Users className="w-8 h-8 text-teknofest-orange mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">إنشاء فريق</h2>
          <p className="text-gray-400 text-sm">أسّس فريقاً جديداً وادعُ أعضاءك</p>
        </Link>
        <Link
          to={`/events/${eventId}/join`}
          className="p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-orange/40 transition-all"
        >
          <UserPlus className="w-8 h-8 text-teknofest-cyan mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">الانضمام لفريق</h2>
          <p className="text-gray-400 text-sm">انضم لفريق موجود أو ادخل قائمة الانتظار</p>
        </Link>
      </div>
    </div>
  )
}
