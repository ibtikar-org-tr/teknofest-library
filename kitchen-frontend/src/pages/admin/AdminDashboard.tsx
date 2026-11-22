import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Users,
  User,
  FileText,
  Star,
  Loader2,
  Trophy,
  Gavel,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { kitchensService, type AdminTeamOverview } from '../../services/api'
import type { KitchenEvent } from '../../types'

type DashboardData = {
  event: KitchenEvent | null
  teams: number
  individuals: number
  unassigned: number
  projects: number
  juries: number
  juriesWithoutTeams: number
  registrationOpen: boolean
  interestMin: number | null
  interestMax: number | null
  competitionCount: number
  pendingAccept: number
  awaitingJury: number
}

type ActionItem = {
  id: string
  title: string
  detail: string
  to: string
  tone: 'urgent' | 'warn' | 'ok' | 'neutral'
  cta: string
}

export default function AdminDashboard() {
  const { eventId = '' } = useParams()
  const base = `/admin/events/${eventId}`
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [event, stats, fields, teams, juries] = await Promise.all([
          kitchensService.get(eventId).catch(() => null),
          kitchensService.getStats(eventId),
          kitchensService.getFields(eventId).catch(() => null),
          kitchensService.getTeams(eventId).catch(() => [] as AdminTeamOverview[]),
          kitchensService.listJuries(eventId).catch(() => ({
            juries: [],
            manager: { membership_number: null, telegram_username: null },
          })),
        ])

        const juryList = Array.isArray(juries) ? juries : juries.juries

        let pendingAccept = 0
        let awaitingJury = 0
        for (const team of teams) {
          for (const stage of [team.stages.primary, team.stages.final]) {
            if (!stage) continue
            if (stage.can_accept) pendingAccept += 1
            else if (
              !stage.score_accepted &&
              stage.required_jury_count > 0 &&
              stage.scored_jury_count < stage.required_jury_count
            ) {
              awaitingJury += 1
            }
          }
        }

        if (!cancelled) {
          setData({
            event,
            teams: Number(stats.teams_count ?? 0),
            individuals: Number(stats.individuals_count ?? 0),
            unassigned:
              Number(stats.individuals_count ?? 0) - Number(stats.assigned_individuals ?? 0),
            projects: Number(stats.projects_count ?? 0),
            juries: juryList.length,
            juriesWithoutTeams: juryList.filter((j) => (j.team_ids?.length ?? 0) === 0).length,
            registrationOpen: Boolean(fields?.registration_open),
            interestMin: fields?.interest_min ?? null,
            interestMax: fields?.interest_max ?? null,
            competitionCount: fields?.competitions?.length ?? 0,
            pendingAccept,
            awaitingJury,
          })
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [eventId])

  const checklist = useMemo(() => {
    if (!data) return []
    return [
      {
        done: data.competitionCount > 0 && data.registrationOpen,
        label: 'تفعيل المسابقات وقواعد الاهتمام',
        to: `${base}/competitions`,
      },
      {
        done: data.juries > 0,
        label: 'تعيين محكّمين',
        to: `${base}/juries`,
      },
      {
        done: data.juries > 0 && data.juriesWithoutTeams === 0,
        label: 'توزيع الفرق على المحكّمين',
        to: `${base}/juries`,
      },
      {
        done: data.unassigned === 0,
        label: 'فرز الأفراد إلى فرق',
        to: `${base}/individuals`,
      },
      {
        done: data.pendingAccept === 0 && data.projects > 0,
        label: 'اعتماد نتائج المراحل الجاهزة',
        to: `${base}/teams`,
      },
    ]
  }, [data, base])

  const actions = useMemo((): ActionItem[] => {
    if (!data) return []
    const items: ActionItem[] = []

    if (!data.registrationOpen) {
      items.push({
        id: 'rules',
        title: 'التسجيل مغلق',
        detail: 'احفظ المسابقات المتاحة وحدّ الاهتمام (أدنى/أقصى) حتى يبدأ الأعضاء.',
        to: `${base}/competitions`,
        tone: 'urgent',
        cta: 'ضبط المسابقات',
      })
    }

    if (data.pendingAccept > 0) {
      items.push({
        id: 'accept',
        title: `${data.pendingAccept} نتيجة جاهزة للاعتماد`,
        detail: 'اكتمل تحكيم المحكّمين — اعتمدها لنشرها في لوحة المتصدرين.',
        to: `${base}/teams`,
        tone: 'urgent',
        cta: 'فتح الفرق',
      })
    }

    if (data.unassigned > 0) {
      items.push({
        id: 'pool',
        title: `${data.unassigned} فرد بانتظار الفرز`,
        detail: 'وزّع المنتظرين في القائمة على فرق مناسبة.',
        to: `${base}/individuals`,
        tone: 'warn',
        cta: 'فرز الأفراد',
      })
    }

    if (data.juries === 0) {
      items.push({
        id: 'juries',
        title: 'لا محكّمين معيّنين',
        detail: 'عيّن محكّمين من مسجّلي الفعالية ثم وزّع عليهم الفرق.',
        to: `${base}/juries`,
        tone: 'warn',
        cta: 'المحكمون',
      })
    } else if (data.juriesWithoutTeams > 0) {
      items.push({
        id: 'assign',
        title: `${data.juriesWithoutTeams} محكّم بلا فرق`,
        detail: 'وزّع الفرق حتى يمكن إكمال التحكيم واعتماد النتائج.',
        to: `${base}/juries`,
        tone: 'warn',
        cta: 'توزيع الفرق',
      })
    }

    if (data.awaitingJury > 0) {
      items.push({
        id: 'scoring',
        title: `${data.awaitingJury} مرحلة بانتظار اكتمال التحكيم`,
        detail: 'تابع التقديمات ودرجات المحكّمين من صفحة الفرق.',
        to: `${base}/teams`,
        tone: 'neutral',
        cta: 'متابعة الفرق',
      })
    }

    if (items.length === 0) {
      items.push({
        id: 'ok',
        title: 'لا مهام عاجلة',
        detail: 'يمكنك مراجعة الفرق أو تحديث المسابقات في أي وقت.',
        to: `${base}/teams`,
        tone: 'ok',
        cta: 'الفرق',
      })
    }

    return items
  }, [data, base])

  const doneCount = checklist.filter((c) => c.done).length

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
      </div>
    )
  }

  const toneClass = {
    urgent: 'border-teknofest-orange/50 bg-teknofest-orange/10',
    warn: 'border-amber-400/40 bg-amber-400/10',
    ok: 'border-green-500/30 bg-green-500/10',
    neutral: 'border-teknofest-light-blue/20 bg-teknofest-dark-blue/40',
  } as const

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-teknofest-cyan text-sm">مطبخ الفعالية</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
            {data.event?.name || 'لوحة الإدارة'}
          </h1>
          <p className="text-gray-500 text-xs font-mono truncate" title={eventId}>
            {eventId}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
              data.registrationOpen
                ? 'border-green-500/40 text-green-400 bg-green-500/10'
                : 'border-teknofest-orange/40 text-teknofest-orange bg-teknofest-orange/10'
            }`}
          >
            {data.registrationOpen ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {data.registrationOpen ? 'التسجيل مفتوح' : 'التسجيل مغلق'}
          </span>
          {data.registrationOpen && data.interestMin != null && data.interestMax != null ? (
            <span className="text-xs text-gray-400 px-2">
              اهتمام {data.interestMin}–{data.interestMax} · {data.competitionCount} مسابقة
            </span>
          ) : null}
          <Link
            to={`/events/${eventId}/leaderboard`}
            className="inline-flex items-center gap-1.5 text-xs text-teknofest-cyan hover:underline"
          >
            لوحة المتصدرين
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">ماذا بعد؟</h2>
          <span className="text-xs text-gray-500">
            جاهزية الإعداد {doneCount}/{checklist.length}
          </span>
        </div>
        <div className="space-y-3">
          {actions.map((action) => (
            <Link
              key={action.id}
              to={action.to}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-colors hover:border-teknofest-cyan/40 ${toneClass[action.tone]}`}
            >
              <div className="min-w-0">
                <p className="text-white font-semibold">{action.title}</p>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{action.detail}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm text-teknofest-cyan shrink-0">
                {action.cta}
                <ArrowLeft className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'الفرق', value: data.teams, to: `${base}/teams`, icon: Users },
          { label: 'تقديمات', value: data.projects, to: `${base}/teams`, icon: FileText },
          {
            label: 'بانتظار الفرز',
            value: data.unassigned,
            to: `${base}/individuals`,
            icon: User,
          },
          { label: 'المحكمون', value: data.juries, to: `${base}/juries`, icon: Gavel },
        ].map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              to={card.to}
              className="rounded-2xl border border-teknofest-light-blue/15 bg-teknofest-medium-blue/30 px-3 sm:px-4 py-3 sm:py-4 hover:border-teknofest-orange/40 transition-colors min-h-[5.5rem]"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                <Icon className="w-4 h-4 text-teknofest-cyan shrink-0" />
                <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                  {card.value}
                </span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm leading-snug">{card.label}</p>
            </Link>
          )
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-white">مسار الإعداد</h2>
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-teknofest-dark-blue/50 transition-colors"
                >
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-500 shrink-0" />
                  )}
                  <span className={item.done ? 'text-gray-400' : 'text-white'}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card space-y-3">
          <h2 className="text-lg font-bold text-white">اختصارات</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { to: `${base}/competitions`, label: 'المسابقات', icon: Trophy },
              { to: `${base}/teams`, label: 'الفرق والنتائج', icon: Users },
              { to: `${base}/individuals`, label: 'الأفراد', icon: User },
              { to: `${base}/juries`, label: 'المحكمون', icon: Gavel },
              { to: `/events/${eventId}/leaderboard`, label: 'المتصدرين', icon: Star },
              { to: '/instructions?tab=admin', label: 'التعليمات', icon: FileText },
            ].map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl bg-teknofest-dark-blue/40 text-gray-200 hover:text-white hover:bg-teknofest-medium-blue/50 text-sm"
                >
                  <Icon className="w-4 h-4 text-teknofest-cyan shrink-0" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
