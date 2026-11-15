import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowRight, Loader2, UserPlus, Users } from 'lucide-react'
import { kitchensService } from '../services/api'
import type { TeamWithSpace } from '../types'

export default function JoinTeam() {
  const { eventId = '' } = useParams()
  const navigate = useNavigate()
  const [teams, setTeams] = useState<TeamWithSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    setLoading(true)
    kitchensService
      .getTeamsWithSpace(eventId)
      .then((data) => {
        if (!cancelled) setTeams(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'تعذر تحميل الفرق المتاحة')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId])

  const handleJoin = async (teamId: number) => {
    if (!eventId || joiningId) return
    setJoiningId(teamId)
    try {
      await kitchensService.joinTeam(eventId, teamId)
      toast.success('تم الانضمام للفريق بنجاح')
      navigate(`/events/${eventId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر الانضمام للفريق')
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        to={`/events/${eventId}`}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8"
      >
        <ArrowRight className="w-4 h-4" />
        العودة لمطبخ الفعالية
      </Link>

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teknofest-orange to-pink-500 mb-4">
          <UserPlus className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">الانضمام لفريق</h1>
        <p className="text-gray-400">اختر فريقاً فيه أماكن شاغرة للانضمام إليه</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
        </div>
      ) : error ? (
        <p className="text-center text-red-400">{error}</p>
      ) : teams.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-10 h-10 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-300 mb-2">لا توجد فرق متاحة حالياً</p>
          <p className="text-gray-500 text-sm mb-6">يمكنك إنشاء فريق جديد بدل الانضمام</p>
          <Link to={`/events/${eventId}/register/team`} className="btn-primary inline-flex">
            إنشاء فريق
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="p-5 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 flex flex-col sm:flex-row sm:items-center gap-4 justify-between"
            >
              <div>
                <h2 className="text-lg font-bold text-white mb-1">{team.team_name}</h2>
                <p className="text-gray-400 text-sm mb-2">{team.field}</p>
                <p className="text-gray-500 text-sm">
                  {team.member_count} أعضاء · {team.available_slots} مقاعد متبقية
                </p>
                {team.members?.length ? (
                  <p className="text-gray-500 text-xs mt-2">
                    الأعضاء: {team.members.map((m) => m.full_name).join('، ')}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={joiningId !== null}
                onClick={() => handleJoin(team.id)}
                className="btn-primary whitespace-nowrap disabled:opacity-50"
              >
                {joiningId === team.id ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الانضمام...
                  </span>
                ) : (
                  'انضم'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
