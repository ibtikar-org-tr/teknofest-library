import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  User,
  Lightbulb,
  Users,
  Check,
  ChevronRight,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import type { Individual, RegistrationType } from '../types'
import { useProjectFields } from '../hooks/useProjectFields'
import { individualsService, kitchensService } from '../services/api'
import { getSession } from '../lib/auth-session'
import { getVmsProfileUrl } from '../lib/vms-sso'
import { libraryCompetitionUrl } from '../lib/competition'

interface IndividualFormData {
  project_idea?: string
}

type VmsSkillsSnapshot = {
  technical_skills: string
  interests: string
  full_name: string
}

export default function IndividualRegistration() {
  const { eventId = '' } = useParams()
  const navigate = useNavigate()
  const {
    fields: projectFields,
    interestMin,
    interestMax,
    registrationOpen,
    loading: fieldsLoading,
  } = useProjectFields(eventId)
  const [step, setStep] = useState(1)
  const [hasIdea, setHasIdea] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vmsProfile, setVmsProfile] = useState<VmsSkillsSnapshot | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<IndividualFormData>()

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    ;(async () => {
      setProfileLoading(true)
      try {
        const profile = await kitchensService.getMyVmsProfile(eventId)
        if (!cancelled) {
          setVmsProfile({
            technical_skills: profile.technical_skills,
            interests: profile.interests,
            full_name: profile.full_name,
          })
        }
      } catch {
        if (!cancelled) {
          setVmsProfile(null)
          toast.error('تعذر تحميل ملفك من VMS')
        }
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [eventId])

  const min = interestMin ?? 1
  const max = interestMax ?? Math.max(min, 5)

  const toggleCompetition = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= max) {
        toast.error(`يمكنك اختيار ${max} مسابقات كحد أقصى`)
        return prev
      }
      return [...prev, id]
    })
  }

  const onSubmit = async (data: IndividualFormData) => {
    if (!eventId) {
      toast.error('معرف الفعالية مفقود')
      return
    }
    if (selectedIds.length < min || selectedIds.length > max) {
      toast.error(`اختر بين ${min} و ${max} مسابقات`)
      return
    }

    const session = getSession()
    if (!session?.user.email || !session.user.membershipNumber) {
      toast.error('تعذر قراءة جلسة VMS — أعد تسجيل الدخول')
      return
    }

    setIsSubmitting(true)
    try {
      const registrationType: RegistrationType = hasIdea
        ? 'individual_with_idea'
        : 'individual_no_idea'

      const individualData = {
        event_id: eventId,
        registration_type: registrationType,
        preferred_field: String(selectedIds[0]) as Individual['preferred_field'],
        preferred_competition_ids: selectedIds,
        project_idea: hasIdea ? data.project_idea : undefined,
        technical_skills: vmsProfile?.technical_skills || '',
        interests: vmsProfile?.interests || '',
        membership_number: session.user.membershipNumber,
        email: session.user.email,
        full_name: session.user.membershipNumber,
        phone: 'n/a',
        gender: 'male' as const,
      }

      await individualsService.create(individualData)
      toast.success('تم التسجيل في القائمة — سيتم توزيعك على فريق قريباً')
      navigate(`/events/${eventId}/dashboard`)
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data?.detail || 'حدث خطأ أثناء التسجيل',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const skillsText = vmsProfile?.technical_skills?.trim() || ''
  const interestsText = vmsProfile?.interests?.trim() || ''

  if (fieldsLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
      </div>
    )
  }

  if (!registrationOpen) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-teknofest-orange">
          التسجيل غير متاح بعد — ينتظر المدير تفعيل المسابقات وقواعد الاهتمام.
        </p>
        <Link to={`/events/${eventId}/dashboard`} className="text-teknofest-cyan hover:underline">
          العودة للوحتي
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to={`/events/${eventId}/join`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8"
        >
          <ArrowRight className="w-4 h-4" />
          خيارات الانضمام
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">الدخول إلى القائمة</h1>
          <p className="text-gray-400">
            سجّل في قائمة الانتظار لتُوزَّع على فريق. بياناتك من VMS — عدّلها من ملفك هناك.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step >= s
                    ? 'bg-purple-500 text-white'
                    : 'bg-teknofest-medium-blue text-gray-400'
                }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                    step > s ? 'bg-purple-500' : 'bg-teknofest-medium-blue'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <div className="card fade-in">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                هل لديك فكرة مشروع؟
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setHasIdea(true)
                    setStep(2)
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    hasIdea === true
                      ? 'border-teknofest-orange bg-teknofest-orange/10'
                      : 'border-teknofest-light-blue/30 hover:border-teknofest-orange/50'
                  }`}
                >
                  <Lightbulb className="w-12 h-12 text-teknofest-orange mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">نعم، لدي فكرة</h3>
                  <p className="text-gray-400 text-sm">
                    لدي فكرة مشروع وأبحث عن فريق لتنفيذها
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasIdea(false)
                    setStep(2)
                  }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    hasIdea === false
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-teknofest-light-blue/30 hover:border-purple-500/50'
                  }`}
                >
                  <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">لا، أبحث عن فريق</h3>
                  <p className="text-gray-400 text-sm">
                    أريد الانضمام لفريق والمساهمة بمهاراتي
                  </p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card fade-in">
              <h2 className="text-2xl font-bold text-white mb-6">تفاصيل التسجيل</h2>

              <div className="space-y-6">
                <div className="rounded-xl border border-teknofest-light-blue/30 bg-teknofest-medium-blue/40 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-medium">المهارات والاهتمامات (من VMS)</p>
                      <p className="text-gray-400 text-sm">
                        للقراءة فقط — عدّلها من ملفك الشخصي في VMS
                      </p>
                    </div>
                    <a
                      href={getVmsProfileUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-teknofest-orange hover:underline"
                    >
                      تعديل في VMS
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {profileLoading ? (
                    <p className="text-gray-400 text-sm">جاري التحميل...</p>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">المهارات التقنية</p>
                        <p className="text-gray-200 whitespace-pre-wrap">
                          {skillsText || 'لا توجد مهارات مسجّلة في ملفك على VMS'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">الاهتمامات</p>
                        <p className="text-gray-200 whitespace-pre-wrap">
                          {interestsText || 'لا توجد اهتمامات مسجّلة في ملفك على VMS'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                    <label className="block text-white font-medium">
                      المسابقات التي تهمّك *
                    </label>
                    <span className="text-xs text-gray-500">
                      اختر بين {min} و {max} — محدد: {selectedIds.length}
                    </span>
                  </div>
                  <ul className="space-y-2 max-h-72 overflow-y-auto rounded-xl border border-teknofest-light-blue/20 divide-y divide-teknofest-light-blue/10">
                    {projectFields.map((field) => {
                      const on = selectedIds.includes(field.id)
                      const href = libraryCompetitionUrl(String(field.id))
                      return (
                        <li key={field.id} className="flex items-stretch bg-teknofest-medium-blue/20">
                          <button
                            type="button"
                            onClick={() => toggleCompetition(field.id)}
                            className={`flex-1 flex items-center gap-3 px-3 py-3 text-right ${
                              on ? 'bg-teknofest-orange/10' : ''
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                                on
                                  ? 'bg-teknofest-orange border-teknofest-orange text-white'
                                  : 'border-gray-500'
                              }`}
                            >
                              {on ? <Check className="w-3.5 h-3.5" /> : null}
                            </span>
                            <span className="text-white text-sm">{field.label}</span>
                          </button>
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 flex items-center text-teknofest-cyan hover:bg-teknofest-medium-blue/40"
                              title="فتح صفحة المسابقة"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {hasIdea && (
                  <div>
                    <label className="block text-white font-medium mb-2">فكرة المشروع *</label>
                    <textarea
                      {...register('project_idea', {
                        required: hasIdea ? 'يرجى وصف فكرة مشروعك' : false,
                        minLength: hasIdea
                          ? { value: 50, message: 'يرجى كتابة وصف أطول لفكرتك' }
                          : undefined,
                      })}
                      className="input-field min-h-[150px]"
                      placeholder="صف فكرة مشروعك بالتفصيل..."
                    />
                    {errors.project_idea && (
                      <p className="text-red-400 text-sm mt-1">{errors.project_idea.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                  السابق
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    profileLoading ||
                    selectedIds.length < min ||
                    selectedIds.length > max
                  }
                  onClick={async (e) => {
                    if (selectedIds.length < min || selectedIds.length > max) {
                      toast.error(`اختر بين ${min} و ${max} مسابقات`)
                      e.preventDefault()
                      return
                    }
                    if (hasIdea) {
                      const ok = await trigger(['project_idea'])
                      if (!ok) e.preventDefault()
                    }
                  }}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      إرسال التسجيل
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
