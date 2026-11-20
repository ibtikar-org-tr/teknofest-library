import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Trophy, Users, Loader2, ArrowRight } from 'lucide-react'
import { kitchensService, type LeaderboardTeam } from '../services/api'

export default function Leaderboard() {
  const { eventId = '' } = useParams()
  const [teams, setTeams] = useState<LeaderboardTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    setLoading(true)
    kitchensService
      .getLeaderboard(eventId)
      .then((data) => {
        if (!cancelled) setTeams(data.teams)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'تعذر تحميل لوحة المتصدرين')
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
        <Link to="/" className="text-teknofest-cyan hover:underline">
          العودة للقائمة
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-teknofest-orange" />
            لوحة المتصدرين
          </h1>
          <p className="text-gray-400 mt-2">جميع فرق هذه الفعالية — الاسم وعدد الأعضاء فقط.</p>
        </div>
        {eventId ? (
          <Link
            to={`/events/${eventId}`}
            className="text-teknofest-cyan hover:underline flex items-center gap-1 text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            المطبخ
          </Link>
        ) : null}
      </div>

      {teams.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          لا توجد فرق مسجّلة بعد
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-teknofest-light-blue/20 text-gray-400 text-sm">
                <th className="px-6 py-4 font-medium">#</th>
                <th className="px-6 py-4 font-medium">اسم الفريق</th>
                <th className="px-6 py-4 font-medium">عدد الأعضاء</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr
                  key={`${team.team_name}-${index}`}
                  className="border-b border-teknofest-light-blue/10 last:border-0 hover:bg-teknofest-medium-blue/30"
                >
                  <td className="px-6 py-4 text-gray-500 tabular-nums">{index + 1}</td>
                  <td className="px-6 py-4 text-white font-medium">{team.team_name}</td>
                  <td className="px-6 py-4 text-teknofest-cyan">
                    <span className="inline-flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {team.member_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
