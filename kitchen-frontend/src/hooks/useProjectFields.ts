import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { kitchensService } from '../services/api'
import type { ProjectFieldOption } from '../types'

export function useProjectFields(eventId: string) {
  const [fields, setFields] = useState<ProjectFieldOption[]>([])
  const [interestMin, setInterestMin] = useState<number | null>(null)
  const [interestMax, setInterestMax] = useState<number | null>(null)
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [loading, setLoading] = useState(Boolean(eventId))

  useEffect(() => {
    if (!eventId) {
      setFields([])
      setInterestMin(null)
      setInterestMax(null)
      setRegistrationOpen(false)
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
        }
      } catch {
        if (!cancelled) {
          setFields([])
          setInterestMin(null)
          setInterestMax(null)
          setRegistrationOpen(false)
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
    loading,
  }
}
