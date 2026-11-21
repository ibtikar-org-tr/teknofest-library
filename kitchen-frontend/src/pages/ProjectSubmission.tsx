import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  FileText,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import type { ApplicationStage, ProjectSubmission, Team } from '../types'
import { kitchensService, projectsService } from '../services/api'
import { getSession } from '../lib/auth-session'

interface ProjectFormData {
  summary: string
}

type PendingFile = {
  id: string
  file: File
  displayName: string
  description: string
}

const STAGE_LABEL: Record<ApplicationStage, string> = {
  primary: 'المرحلة الأولية',
  final: 'المرحلة النهائية',
}

const MAX_FILES = 10
const MAX_FILE_BYTES = 10 * 1024 * 1024

function parseStage(raw: string | null): ApplicationStage {
  return raw === 'final' ? 'final' : 'primary'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProjectSubmission() {
  const { eventId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const stage = parseStage(searchParams.get('stage'))
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkingTeam, setCheckingTeam] = useState(true)
  const [myTeam, setMyTeam] = useState<Team | null>(null)
  const [existing, setExisting] = useState<ProjectSubmission[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>()

  const hasPrimary = useMemo(
    () => existing.some((p) => p.stage === 'primary'),
    [existing],
  )
  const alreadySubmitted = useMemo(
    () => existing.some((p) => p.stage === stage),
    [existing, stage],
  )

  useEffect(() => {
    if (!eventId) {
      setCheckingTeam(false)
      return
    }
    let cancelled = false
    setCheckingTeam(true)
    Promise.all([
      kitchensService.getMyTeam(eventId),
      kitchensService.getMyProjects(eventId).catch(() => ({ team_id: 0, projects: [] })),
    ])
      .then(([team, projectsRes]) => {
        if (cancelled) return
        setMyTeam(team)
        setExisting(projectsRes.projects ?? [])
      })
      .catch(() => {
        if (!cancelled) {
          setMyTeam(null)
          setExisting([])
        }
      })
      .finally(() => {
        if (!cancelled) setCheckingTeam(false)
      })
    return () => {
      cancelled = true
    }
  }, [eventId])

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return
    const next: PendingFile[] = []
    for (const file of Array.from(list)) {
      if (pendingFiles.length + next.length >= MAX_FILES) {
        toast.error(`الحد الأقصى ${MAX_FILES} ملفات`)
        break
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name}: أكبر من 10MB`)
        continue
      }
      if (file.size <= 0) {
        toast.error(`${file.name}: ملف فارغ`)
        continue
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        displayName: file.name.replace(/\.[^.]+$/, '') || file.name,
        description: '',
      })
    }
    if (next.length) setPendingFiles((prev) => [...prev, ...next])
  }

  const updatePending = (id: string, patch: Partial<Pick<PendingFile, 'displayName' | 'description'>>) => {
    setPendingFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  const removePending = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const onSubmit = async (data: ProjectFormData) => {
    if (!eventId) {
      toast.error('معرف الفعالية مفقود')
      return
    }
    if (!myTeam?.id) {
      toast.error('تقديم المشروع متاح للفرق فقط')
      return
    }
    if (stage === 'final' && !hasPrimary) {
      toast.error('يجب تقديم المرحلة الأولية أولاً')
      return
    }
    if (alreadySubmitted) {
      toast.error('تم تقديم هذه المرحلة مسبقاً')
      return
    }
    if (pendingFiles.length === 0) {
      toast.error('أرفق ملفاً واحداً على الأقل')
      return
    }
    if (pendingFiles.some((f) => !f.displayName.trim())) {
      toast.error('سمِّ كل ملف قبل التقديم')
      return
    }
    if (!getSession()?.user.email) {
      toast.error('تعذر قراءة البريد من جلسة VMS — أعد تسجيل الدخول')
      return
    }

    setIsSubmitting(true)
    try {
      const project = await projectsService.submit({
        event_id: eventId,
        team_id: myTeam.id,
        stage,
        summary: data.summary.trim(),
        program_version_id: 1,
      })

      for (const item of pendingFiles) {
        await projectsService.uploadFile(project.id!, {
          file: item.file,
          display_name: item.displayName.trim(),
          description: item.description.trim() || undefined,
        })
      }

      toast.success(`تم تقديم ${STAGE_LABEL[stage]} بنجاح`)
      navigate(`/events/${eventId}/dashboard`)
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data?.detail || 'حدث خطأ أثناء التقديم',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checkingTeam) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
      </div>
    )
  }

  if (!myTeam) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-xl mx-auto text-center card space-y-4">
          <AlertCircle className="w-10 h-10 text-teknofest-orange mx-auto" />
          <h1 className="text-2xl font-bold text-white">التقديم للفرق فقط</h1>
          <p className="text-gray-400">يجب أن تكون عضواً في فريق ضمن هذه الفعالية.</p>
          <Link to={`/events/${eventId}/dashboard`} className="btn-primary inline-flex justify-center">
            لوحتي
          </Link>
        </div>
      </div>
    )
  }

  if (!myTeam.field?.trim()) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-xl mx-auto text-center card space-y-4">
          <AlertCircle className="w-10 h-10 text-yellow-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">اختر المسابقة أولاً</h1>
          <p className="text-gray-400">
            الخطوة الأولى في لوحتي هي اختيار المسابقة، ثم يمكنك تقديم المرحلة الأولية أو النهائية.
          </p>
          <Link to={`/events/${eventId}/dashboard`} className="btn-primary inline-flex justify-center">
            العودة للوحتي
          </Link>
        </div>
      </div>
    )
  }

  if (stage === 'final' && !hasPrimary) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-xl mx-auto text-center card space-y-4">
          <AlertCircle className="w-10 h-10 text-yellow-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">المرحلة النهائية غير متاحة بعد</h1>
          <p className="text-gray-400">قدّم المرحلة الأولية أولاً، ثم يمكنك التقديم للمرحلة النهائية.</p>
          <Link
            to={`/events/${eventId}/project/submit?stage=primary`}
            className="btn-primary inline-flex justify-center"
          >
            تقديم المرحلة الأولية
          </Link>
        </div>
      </div>
    )
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-xl mx-auto text-center card space-y-4">
          <Check className="w-10 h-10 text-green-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">تم تقديم {STAGE_LABEL[stage]}</h1>
          <p className="text-gray-400">لا يمكن إعادة تقديم نفس المرحلة.</p>
          <Link to={`/events/${eventId}/dashboard`} className="btn-secondary inline-flex justify-center">
            العودة للوحتي
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{STAGE_LABEL[stage]}</h1>
          <p className="text-gray-400">
            فريق <span className="text-teknofest-orange">{myTeam.team_name}</span> — ملخص وملفات
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {myTeam.field_label || myTeam.field}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teknofest-orange" />
              ملخص المشروع
            </h2>
            <textarea
              {...register('summary', {
                required: 'الملخص مطلوب',
                minLength: { value: 20, message: 'اكتب ملخصاً أوضح (20 حرفاً على الأقل)' },
              })}
              className="input-field min-h-[160px]"
              placeholder="اكتب ملخصاً موجزاً عن مشروعك في هذه المرحلة..."
            />
            {errors.summary && (
              <p className="text-red-400 text-sm mt-1">{errors.summary.message}</p>
            )}
          </div>

          <div className="card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-green-400" />
                  الملفات
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  حتى {MAX_FILES} ملفات · 10MB لكل ملف · اسم + وصف اختياري
                </p>
              </div>
              <div>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="multi-file-upload"
                  disabled={pendingFiles.length >= MAX_FILES}
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                <label
                  htmlFor="multi-file-upload"
                  className={`btn-secondary inline-flex items-center gap-2 cursor-pointer ${
                    pendingFiles.length >= MAX_FILES ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  إضافة ملفات
                </label>
              </div>
            </div>

            {pendingFiles.length === 0 ? (
              <p className="text-gray-500 text-sm py-6 text-center border border-dashed border-teknofest-light-blue/30 rounded-xl">
                لم تُضف ملفات بعد — أرفق ملفاً واحداً على الأقل
              </p>
            ) : (
              <ul className="space-y-4">
                {pendingFiles.map((item, index) => (
                  <li
                    key={item.id}
                    className="p-4 rounded-xl bg-teknofest-medium-blue/40 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">ملف {index + 1}</p>
                        <p className="text-sm text-gray-300 truncate">
                          {item.file.name} · {formatSize(item.file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePending(item.id)}
                        className="p-2 text-gray-400 hover:text-red-400"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <label className="block text-sm text-gray-300">
                      اسم الملف *
                      <input
                        type="text"
                        className="input-field mt-1"
                        value={item.displayName}
                        onChange={(e) => updatePending(item.id, { displayName: e.target.value })}
                        placeholder="مثال: مخطط النظام"
                      />
                    </label>
                    <label className="block text-sm text-gray-300">
                      وصف (اختياري)
                      <textarea
                        className="input-field mt-1 min-h-[72px]"
                        value={item.description}
                        onChange={(e) => updatePending(item.id, { description: e.target.value })}
                        placeholder="ماذا يحتوي هذا الملف؟"
                      />
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary px-12 py-4 text-lg flex items-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري التقديم...
                </>
              ) : (
                <>
                  <Check className="w-6 h-6" />
                  تقديم {STAGE_LABEL[stage]}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
