import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckSquare, Loader2, Save, Search, Square } from 'lucide-react'
import { kitchensService } from '../../services/api'
import type { ProjectFieldOption } from '../../types'

type CatalogRow = ProjectFieldOption & { selected: boolean }

export default function AdminCompetitions() {
  const { eventId = '' } = useParams()
  const [rows, setRows] = useState<CatalogRow[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const data = await kitchensService.getCompetitionCatalog(eventId)
      setRows(data.competitions)
      setSelected(new Set(data.selected_ids))
    } catch {
      toast.error('تعذر تحميل مسابقات المكتبة')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.labelEn.toLowerCase().includes(q) ||
        r.labelTr.toLowerCase().includes(q) ||
        String(r.id).includes(q),
    )
  }, [rows, search])

  const dirty = useMemo(() => {
    const initial = new Set(rows.filter((r) => r.selected).map((r) => r.id))
    if (initial.size !== selected.size) return true
    for (const id of selected) {
      if (!initial.has(id)) return true
    }
    return false
  }, [rows, selected])

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of filtered) next.add(r.id)
      return next
    })
  }

  const clearVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of filtered) next.delete(r.id)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const ids = [...selected].sort((a, b) => a - b)
      await kitchensService.setKitchenCompetitions(eventId, ids)
      toast.success(`تم حفظ ${ids.length} مسابقة للمطبخ`)
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر حفظ المسابقات')
    } finally {
      setSaving(false)
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
      <div className="card space-y-2">
        <h1 className="text-2xl font-bold text-white">مسابقات المطبخ</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          اختر المسابقات المتاحة من مكتبة تكنوفيست. الفرق والأفراد يرون هذه القائمة فقط، ويتم
          التخزين برقم المسابقة (ID) لفتح الصفحة الصحيحة في المكتبة.
        </p>
        <p className="text-teknofest-cyan text-sm">
          محدد حالياً: <strong className="text-white">{selected.size}</strong> من {rows.length}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الرقم…"
            className="input-field pr-10"
          />
        </div>
        <button type="button" onClick={selectVisible} className="btn-secondary text-sm">
          تحديد الظاهر
        </button>
        <button type="button" onClick={clearVisible} className="btn-secondary text-sm">
          إلغاء الظاهر
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !dirty}
          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <ul className="divide-y divide-teknofest-light-blue/10 max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-4 py-10 text-center text-gray-500">لا نتائج</li>
          ) : (
            filtered.map((row) => {
              const on = selected.has(row.id)
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-right transition-colors ${
                      on ? 'bg-teknofest-orange/10' : 'hover:bg-teknofest-medium-blue/40'
                    }`}
                  >
                    {on ? (
                      <CheckSquare className="w-5 h-5 text-teknofest-orange shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{row.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        #{row.id}
                        {row.labelEn && row.labelEn !== row.label ? ` · ${row.labelEn}` : ''}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
