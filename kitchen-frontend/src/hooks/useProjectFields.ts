import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { kitchensService } from '../services/api'
import type { ProjectFieldOption } from '../types'

export function useProjectFields(eventId: string) {
  const [fields, setFields] = useState<ProjectFieldOption[]>([])
  const [loading, setLoading] = useState(Boolean(eventId))

  useEffect(() => {
    if (!eventId) {
      setFields([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const data = await kitchensService.getFields(eventId)
        if (!cancelled) setFields(data)
      } catch {
        if (!cancelled) {
          setFields([])
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

  return { fields, loading }
}
