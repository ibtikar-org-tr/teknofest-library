import { Link, useParams } from 'react-router-dom'
import { ArrowRight, ListPlus, UserPlus } from 'lucide-react'

export default function JoinOptions() {
  const { eventId = '' } = useParams()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link
        to={`/events/${eventId}/my-team`}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowRight className="w-4 h-4" />
        فريقي
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">الانضمام لفريق</h1>
        <p className="text-gray-400">اختر كيف تريد الانضمام — الجميع في النهاية ضمن فرق.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Link
          to={`/events/${eventId}/join/team`}
          className="p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-orange/40 transition-all"
        >
          <UserPlus className="w-8 h-8 text-teknofest-orange mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">الانضمام لفريق محدد</h2>
          <p className="text-gray-400 text-sm">اختر فريقاً موجوداً فيه أماكن شاغرة</p>
        </Link>
        <Link
          to={`/events/${eventId}/join/pool`}
          className="p-6 rounded-2xl border border-teknofest-light-blue/20 bg-teknofest-medium-blue/40 hover:border-teknofest-cyan/40 transition-all"
        >
          <ListPlus className="w-8 h-8 text-teknofest-cyan mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">الدخول إلى القائمة</h2>
          <p className="text-gray-400 text-sm">
            سجّل في قائمة الانتظار ليُوزَّع عليك فريق — ثم تُسأل إن كانت لديك فكرة
          </p>
        </Link>
      </div>
    </div>
  )
}
