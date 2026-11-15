import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, Lightbulb, Users, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { PROJECT_FIELDS, type Individual, type RegistrationType } from '../types'
import { individualsService } from '../services/api'
import { getSession } from '../lib/auth-session'

interface IndividualFormData {
  technical_skills: string
  interests: string
  experience_level: string
  preferred_field: string
  project_idea?: string
}

const experienceLevels = [
  { value: 'beginner', label: 'مبتدئ' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'متقدم' },
  { value: 'expert', label: 'خبير' },
]

export default function IndividualRegistration() {
  const { eventId = '' } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [hasIdea, setHasIdea] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<IndividualFormData>()

  const onSubmit = async (data: IndividualFormData) => {
    if (!eventId) {
      toast.error('معرف الفعالية مفقود')
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

      // Identity fields (name, phone, gender, email, membership) come from VMS on the backend.
      const individualData = {
        event_id: eventId,
        registration_type: registrationType,
        preferred_field: data.preferred_field as Individual['preferred_field'],
        technical_skills: data.technical_skills,
        interests: data.interests,
        experience_level: data.experience_level,
        project_idea: hasIdea ? data.project_idea : undefined,
        // Placeholders overwritten by kitchen-backend from VMS profile:
        membership_number: session.user.membershipNumber,
        email: session.user.email,
        full_name: session.user.membershipNumber,
        phone: 'n/a',
        gender: 'male' as const,
      }

      await individualsService.create(individualData)
      toast.success('تم التسجيل بنجاح! سيتم التواصل معك قريباً')
      navigate(`/events/${eventId}`)
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data?.detail || 'حدث خطأ أثناء التسجيل',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">تسجيل فردي</h1>
          <p className="text-gray-400">
            بياناتك الشخصية من VMS — هنا فقط مهاراتك واهتماماتك
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
              <h2 className="text-2xl font-bold text-white mb-6">المهارات والاهتمامات</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">مستوى الخبرة في مجالك *</label>
                  <select
                    {...register('experience_level', { required: 'يرجى اختيار مستوى الخبرة' })}
                    className="input-field"
                  >
                    <option value="">اختر مستوى خبرتك</option>
                    {experienceLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  {errors.experience_level && (
                    <p className="text-red-400 text-sm mt-1">{errors.experience_level.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">المجال المفضل *</label>
                  <select
                    {...register('preferred_field', { required: 'يرجى اختيار المجال المفضل' })}
                    className="input-field"
                  >
                    <option value="">اختر المسابقة المفضلة</option>
                    {PROJECT_FIELDS.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                  {errors.preferred_field && (
                    <p className="text-red-400 text-sm mt-1">{errors.preferred_field.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">المهارات التقنية *</label>
                  <textarea
                    {...register('technical_skills', {
                      required: 'يرجى ذكر مهاراتك التقنية',
                      minLength: { value: 10, message: 'يرجى كتابة المزيد عن مهاراتك' },
                    })}
                    className="input-field min-h-[100px]"
                    placeholder="مثال: Python, JavaScript, تعلم الآلة, تطوير تطبيقات الجوال..."
                  />
                  {errors.technical_skills && (
                    <p className="text-red-400 text-sm mt-1">{errors.technical_skills.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">الاهتمامات *</label>
                  <textarea
                    {...register('interests', {
                      required: 'يرجى ذكر اهتماماتك',
                      minLength: { value: 10, message: 'يرجى كتابة المزيد عن اهتماماتك' },
                    })}
                    className="input-field min-h-[100px]"
                    placeholder="مثال: الذكاء الاصطناعي، الروبوتات، الطاقة المتجددة..."
                  />
                  {errors.interests && (
                    <p className="text-red-400 text-sm mt-1">{errors.interests.message}</p>
                  )}
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
                  disabled={isSubmitting}
                  onClick={async (e) => {
                    const fields: Array<keyof IndividualFormData> = [
                      'experience_level',
                      'preferred_field',
                      'technical_skills',
                      'interests',
                    ]
                    if (hasIdea) fields.push('project_idea')
                    const ok = await trigger(fields)
                    if (!ok) e.preventDefault()
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
