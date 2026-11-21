import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  Plus,
  PowerOff,
  UtensilsCrossed,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '../../services/api'
import { getVmsEventUrl } from '../../lib/vms-sso'
import type { KitchenEvent } from '../../types'
import AdminPageHeader from '../../components/AdminPageHeader'

export default function AdminKitchens() {
  const [events, setEvents] = useState<KitchenEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminService.listVmsEvents()
      setEvents(data)
    } catch (error) {
      console.error(error)
      toast.error('تعذر تحميل فعاليات VMS')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const enable = async (eventId: string) => {
    setBusyId(eventId)
    try {
      await adminService.enableKitchen(eventId)
      toast.success('تم إنشاء / تفعيل المطبخ')
      await load()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل التفعيل')
    } finally {
      setBusyId(null)
    }
  }

  const disable = async (eventId: string) => {
    setBusyId(eventId)
    try {
      await adminService.disableKitchen(eventId)
      toast.success('تم تعطيل المطبخ')
      await load()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل التعطيل')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Calendar}
        title="مطابخ الفعاليات"
        description="فعاليات VMS التي تديرها — فعّل مطبخاً لها. المشاركون المسجّلون يدخلون المطبخ؛ المديرون يدخلونه أيضاً."
        tone="cyan"
      />

      <div className="space-y-3">
        {events.map((event) => {
          const busy = busyId === event.id
          return (
            <div
              key={event.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between p-4 rounded-xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/30"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    event.kitchen_enabled
                      ? 'bg-green-500/15 text-green-300'
                      : 'bg-gray-500/15 text-gray-400'
                  }`}
                >
                  <UtensilsCrossed className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={getVmsEventUrl(event.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-lg font-semibold text-white hover:text-teknofest-orange transition-colors"
                      title="فتح الفعالية في VMS"
                    >
                      <span className="truncate">{event.name}</span>
                      <ExternalLink className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100" />
                    </a>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        event.kitchen_enabled
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {event.kitchen_enabled ? 'مطبخ مفعّل' : 'بدون مطبخ'}
                    </span>
                    <span className="text-xs text-gray-500">{event.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono truncate">{event.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {event.kitchen_enabled ? (
                  <>
                    <Link
                      to={`/admin/events/${event.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-teknofest-orange text-white hover:opacity-90"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      إدارة
                    </Link>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void disable(event.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-red-400/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PowerOff className="w-4 h-4" />}
                      تعطيل
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void enable(event.id)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-teknofest-cyan text-teknofest-dark-blue font-medium disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    إنشاء مطبخ
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {events.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            لا توجد فعاليات في VMS
          </div>
        ) : null}
      </div>
    </div>
  )
}
