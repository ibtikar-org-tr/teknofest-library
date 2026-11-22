import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Gavel, Search } from 'lucide-react'
import type { EventTeamStageIndex } from '../services/api'

function StageChip({
  label,
  submitted,
  scored,
  total,
}: {
  label: string
  submitted: boolean
  scored: number
  total: number
}) {
  if (!submitted) {
    return (
      <span
        title={`${label}: لم يُسلَّم`}
        className="inline-flex items-center gap-1 rounded-md border border-gray-600/70 px-1.5 py-0.5 text-[10px] font-bold text-gray-500"
      >
        {label}
        <span className="font-normal">—</span>
      </span>
    )
  }

  const done = total > 0 && scored >= total
  return (
    <span
      title={`${label}: سُلّم · قيّم ${scored} من ${total} محكم`}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
        done
          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
          : 'border-teknofest-cyan/60 bg-teknofest-cyan/10 text-teknofest-cyan'
      }`}
    >
      {label}
      {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      <span className="font-semibold tabular-nums" dir="ltr">
        {scored}/{total}
      </span>
    </span>
  )
}

type TeamAddDropdownProps = {
  teams: EventTeamStageIndex[]
  disabled?: boolean
  placeholder?: string
  emptyLabel?: string
  onPick: (team: EventTeamStageIndex) => void
}

export default function TeamAddDropdown({
  teams,
  disabled = false,
  placeholder = 'إضافة فريق…',
  emptyLabel = 'لا فرق متاحة للإضافة',
  onPick,
}: TeamAddDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return teams
    return teams.filter((t) => t.team_name.toLowerCase().includes(q))
  }, [teams, query])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => searchRef.current?.focus(), 0)
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const isEmpty = teams.length === 0

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <button
        type="button"
        disabled={disabled || isEmpty}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled || isEmpty) return
          setOpen((v) => !v)
        }}
        className="input-field w-full flex items-center justify-between gap-2 text-start disabled:opacity-50"
      >
        <span className={isEmpty ? 'text-gray-500' : 'text-gray-200'}>
          {isEmpty ? emptyLabel : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !isEmpty ? (
        <div
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 w-full rounded-xl border border-teknofest-light-blue/30 bg-teknofest-dark-blue shadow-xl overflow-hidden"
        >
          <div className="relative border-b border-teknofest-light-blue/15 p-2">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث عن فريق…"
              className="input-field w-full pr-9 py-2 text-sm"
            />
          </div>

          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-sm text-gray-500 text-center">لا نتائج</li>
            ) : (
              filtered.map((team) => {
                const juryCount = team.jury_count ?? 0
                return (
                  <li key={team.team_id} role="option">
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-start hover:bg-teknofest-cyan/10 transition-colors border-b border-teknofest-light-blue/10 last:border-b-0"
                      onClick={() => {
                        onPick(team)
                        setOpen(false)
                        setQuery('')
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <span className="text-sm text-white font-medium truncate">
                          {team.team_name}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 shrink-0 rounded-md bg-teknofest-orange/15 text-teknofest-orange px-1.5 py-0.5 text-[10px] font-semibold"
                          title="عدد المحكمين المعيّنين"
                        >
                          <Gavel className="w-3 h-3" />
                          <span className="tabular-nums" dir="ltr">
                            {juryCount}
                          </span>
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <StageChip
                          label="١"
                          submitted={team.primary_submitted}
                          scored={team.primary_scored_count ?? 0}
                          total={juryCount}
                        />
                        <StageChip
                          label="ن"
                          submitted={team.final_submitted}
                          scored={team.final_scored_count ?? 0}
                          total={juryCount}
                        />
                      </div>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
