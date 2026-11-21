import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { kitchensService } from '../services/api'
import type { ProjectFieldOption } from '../types'

const DEFAULT_MAX_TEAM_SIZE = 8

export function useProjectFields(eventId: string) {
  const [fields, setFields] = useState<ProjectFieldOption[]>([])
  const [interestMin, setInterestMin] = useState<number | null>(null)
  const [interestMax, setInterestMax] = useState<number | null>(null)
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [allowCreateTeams, setAllowCreateTeams] = useState(false)
  const [allowJoinTeams, setAllowJoinTeams] = useState(false)
  const [maxTeamSize, setMaxTeamSize] = useState(DEFAULT_MAX_TEAM_SIZE)
  const [loading, setLoading] = useState(Boolean(eventId))

  useEffect(() => {
    if (!eventId) {
      setFields([])
      setInterestMin(null)
      setInterestMax(null)
      setRegistrationOpen(false)
      setAllowCreateTeams(false)
      setAllowJoinTeams(false)
      setMaxTeamSize(DEFAULT_MAX_TEAM_SIZE)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const data = await kitchensService.getFields(eventId)
        if (!cancelled) {
          setFields(data.competitions ?? [])
          setInterestMin(data.interest_min)
          setInterestMax(data.interest_max)
          setRegistrationOpen(Boolean(data.registration_open))
          setAllowCreateTeams(Boolean(data.allow_create_teams))
          setAllowJoinTeams(Boolean(data.allow_join_teams))
          setMaxTeamSize(
            Number.isFinite(data.max_team_size) && data.max_team_size > 0
              ? data.max_team_size
              : DEFAULT_MAX_TEAM_SIZE,
          )
        }
      } catch {
        if (!cancelled) {
          setFields([])
          setInterestMin(null)
          setInterestMax(null)
          setRegistrationOpen(false)
          setAllowCreateTeams(false)
          setAllowJoinTeams(false)
          setMaxTeamSize(DEFAULT_MAX_TEAM_SIZE)
          toast.error('تعذر تحميل قائمة المسابقات من المكتبة')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [eventId])

  return {
    fields,
    interestMin,
    interestMax,
    registrationOpen,
    allowCreateTeams,
    allowJoinTeams,
    maxTeamSize,
    loading,
  }
}
