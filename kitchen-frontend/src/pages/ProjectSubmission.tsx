import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  FileText,
  Upload,
  Image,
  FileImage,
  PenTool,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { ApplicationStage, ProjectSubmission, Team } from '../types'
import { kitchensService, projectsService } from '../services/api'
import { getSession } from '../lib/auth-session'

interface ProjectFormData {
  summary: string
}

const STAGE_LABEL: Record<ApplicationStage, string> = {
  primary: 'المرحلة الأولية',
  final: 'المرحلة النهائية',
}

function parseStage(raw: string | null): ApplicationStage {
  return raw === 'final' ? 'final' : 'primary'
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
  const [attachments, setAttachments] = useState<{
    image: File | null
    diagram: File | null
    design: File | null
  }>({ image: null, diagram: null, design: null })

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

  const handleFileChange = (type: 'image' | 'diagram' | 'design', file: File | null) => {
    setAttachments((prev) => ({ ...prev, [type]: file }))
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
    if (!attachments.image && !attachments.diagram && !attachments.design) {
      toast.error('أرفق ملفاً واحداً على الأقل')
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

      const formData = new FormData()
      if (attachments.image) formData.append('image', attachments.image)
      if (attachments.diagram) formData.append('diagram', attachments.diagram)
      if (attachments.design) formData.append('design', attachments.design)
      try {
        await projectsService.uploadAttachments(project.id!, formData)
      } catch {
        toast.error('تم حفظ الملخص لكن تعذر رفع الملفات — حاول لاحقاً من لوحتي')
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
            فريق <span className="text-teknofest-orange">{myTeam.team_name}</span> — ملخص وملفات فقط
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

          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-400" />
              الملفات
            </h2>
            <p className="text-gray-400 text-sm mb-2">أرفق ملفاً واحداً على الأقل (مطلوب).</p>
            <p className="text-gray-500 text-xs mb-6">الأنواع: PNG, JPG, JPEG, PDF, ZIP</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border-2 border-dashed border-teknofest-light-blue/30 rounded-xl">
                <div className="text-center">
                  <Image className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-white font-medium mb-2">صورة</h3>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,.zip"
                    onChange={(e) => handleFileChange('image', e.target.files?.[0] || null)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer text-teknofest-orange hover:text-teknofest-orange-hover text-sm"
                  >
                    {attachments.image ? attachments.image.name : 'اختر ملف'}
                  </label>
                </div>
              </div>
              <div className="p-4 border-2 border-dashed border-teknofest-light-blue/30 rounded-xl">
                <div className="text-center">
                  <FileImage className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-white font-medium mb-2">مخطط</h3>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,.zip"
                    onChange={(e) => handleFileChange('diagram', e.target.files?.[0] || null)}
                    className="hidden"
                    id="diagram-upload"
                  />
                  <label
                    htmlFor="diagram-upload"
                    className="cursor-pointer text-teknofest-orange hover:text-teknofest-orange-hover text-sm"
                  >
                    {attachments.diagram ? attachments.diagram.name : 'اختر ملف'}
                  </label>
                </div>
              </div>
              <div className="p-4 border-2 border-dashed border-teknofest-light-blue/30 rounded-xl">
                <div className="text-center">
                  <PenTool className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-white font-medium mb-2">تصميم</h3>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf,.zip"
                    onChange={(e) => handleFileChange('design', e.target.files?.[0] || null)}
                    className="hidden"
                    id="design-upload"
                  />
                  <label
                    htmlFor="design-upload"
                    className="cursor-pointer text-teknofest-orange hover:text-teknofest-orange-hover text-sm"
                  >
                    {attachments.design ? attachments.design.name : 'اختر ملف'}
                  </label>
                </div>
              </div>
            </div>
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
