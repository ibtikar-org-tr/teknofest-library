import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { kitchensService } from '../services/api'
import MyTeam from './MyTeam'
import JuryScoring from './JuryScoring'

/**
 * Single member hub: juries see scoring; everyone else sees team create/join/project.
 * Juries cannot be on teams (enforced by the API).
 */
export default function MemberDashboard() {
  const { eventId = '' } = useParams()
  const [isJury, setIsJury] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    kitchensService
      .get(eventId)
      .then((kitchen) => {
        if (!cancelled) setIsJury(Boolean(kitchen.is_jury))
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'تعذر فتح لوحة التحكم')
          setIsJury(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [eventId])

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-red-400 mb-6">{error}</p>
        <Link to={`/events/${eventId}`} className="text-teknofest-cyan hover:underline">
          العودة للمطبخ
        </Link>
      </div>
    )
  }

  if (isJury === null) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
      </div>
    )
  }

  return isJury ? <JuryScoring /> : <MyTeam />
}
