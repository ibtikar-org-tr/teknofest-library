import { Link, useParams } from 'react-router-dom'
import { ArrowRight, ListPlus, Loader2, UserPlus } from 'lucide-react'
import { useProjectFields } from '../hooks/useProjectFields'

export default function JoinOptions() {
  const { eventId = '' } = useParams()
  const { registrationOpen, allowJoinTeams, allowCreateTeams, loading } =
    useProjectFields(eventId)

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link
        to={`/events/${eventId}/dashboard`}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowRight className="w-4 h-4" />
        لوحتي
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">الانضمام لفريق</h1>
        <p className="text-gray-400">اختر كيف تريد الانضمام — الجميع في النهاية ضمن فرق.</p>
      </div>

      {!registrationOpen ? (
        <div className="card border border-teknofest-orange/40 text-teknofest-orange text-sm leading-relaxed">
          التسجيل مغلق حالياً. يجب أن يضبط مدير الفعالية المسابقات المتاحة وحدود الاهتمام
          (الحد الأدنى والأقصى) قبل إنشاء فرق أو الانضمام.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {allowJoinTeams ? (
            <Link
              to={`/events/${eventId}/join/team`}
              className="p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-orange/40 transition-all"
            >
              <UserPlus className="w-8 h-8 text-teknofest-orange mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">الانضمام لفريق محدد</h2>
              <p className="text-gray-400 text-sm">اختر فريقاً موجوداً فيه أماكن شاغرة</p>
            </Link>
          ) : (
            <div className="p-6 rounded-2xl border border-teknofest-light-blue/10 bg-teknofest-medium-blue/20 opacity-70">
              <UserPlus className="w-8 h-8 text-gray-500 mb-4" />
              <h2 className="text-xl font-bold text-gray-300 mb-2">الانضمام لفريق محدد</h2>
              <p className="text-gray-500 text-sm">
                معطّل من إعدادات المطبخ — المدير يفرز الأعضاء للفرق
              </p>
            </div>
          )}
          <Link
            to={`/events/${eventId}/join/pool`}
            className="p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-cyan/40 transition-all"
          >
            <ListPlus className="w-8 h-8 text-teknofest-cyan mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">الدخول إلى القائمة</h2>
            <p className="text-gray-400 text-sm">
              سجّل اهتماماتك بمسابقات المطبخ ليُوزَّع عليك فريق
            </p>
          </Link>
        </div>
      )}

      {registrationOpen && allowCreateTeams ? (
        <p className="text-sm text-gray-500">
          تريد إنشاء فريق؟{' '}
          <Link to={`/events/${eventId}/register/team`} className="text-teknofest-cyan hover:underline">
            إنشاء فريق جديد
          </Link>
        </p>
      ) : null}
    </div>
  )
}
