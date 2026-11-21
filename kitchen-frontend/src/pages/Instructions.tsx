import { useMemo, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BookOpen,
  Users,
  Star,
  Shield,
  Trophy,
  FileText,
  UserPlus,
  Lock,
  ArrowLeftRight,
} from 'lucide-react'

type TabId = 'members' | 'jury' | 'admin'

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: 'members', label: 'للأعضاء والفرق', icon: Users },
  { id: 'jury', label: 'للمحكّمين', icon: Star },
  { id: 'admin', label: 'للمديرين', icon: Shield },
]

function parseTab(raw: string | null): TabId {
  if (raw === 'jury' || raw === 'admin') return raw
  return 'members'
}

export default function Instructions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = useMemo(() => parseTab(searchParams.get('tab')), [searchParams])

  const setTab = (next: TabId) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === 'members') p.delete('tab')
        else p.set('tab', next)
        return p
      },
      { replace: true },
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teknofest-orange to-teknofest-cyan mb-2">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">دليل المطبخ</h1>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            صفحة واحدة للجميع: كيف تعمل الفرق والتقديم والتحكيم والإدارة. اختر التبويب المناسب لك.
          </p>
        </header>

        <div
          className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-2xl bg-teknofest-medium-blue/50 border border-teknofest-light-blue/20"
          role="tablist"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-teknofest-orange text-white shadow-lg shadow-teknofest-orange/20'
                    : 'text-gray-300 hover:bg-teknofest-dark-blue/60 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            )
          })}
        </div>

        <div className="space-y-6" role="tabpanel">
          {tab === 'members' ? <MembersGuide /> : null}
          {tab === 'jury' ? <JuryGuide /> : null}
          {tab === 'admin' ? <AdminGuide /> : null}
        </div>

        <p className="text-center text-sm text-gray-500">
          تحتاج مساعدة إضافية؟ تواصل مع مدير الفعالية عبر قنوات ابتكار / تكنوفيست.
        </p>
      </div>
    </div>
  )
}

function Step({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-full bg-teknofest-orange/20 text-teknofest-orange font-bold flex items-center justify-center">
        {n}
      </div>
      <div className="min-w-0 space-y-1 pb-6 border-b border-teknofest-light-blue/10 last:border-0 last:pb-0">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <div className="text-gray-400 text-sm leading-relaxed space-y-2">{children}</div>
      </div>
    </div>
  )
}

function Callout({
  icon: Icon,
  children,
}: {
  icon: typeof Lock
  children: ReactNode
}) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-teknofest-dark-blue/50 border border-teknofest-light-blue/15 text-sm text-gray-300">
      <Icon className="w-5 h-5 text-teknofest-cyan shrink-0 mt-0.5" />
      <div className="leading-relaxed">{children}</div>
    </div>
  )
}

function MembersGuide() {
  return (
    <div className="card space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">للأعضاء والفرق الجدد</h2>
        <p className="text-gray-400 text-sm">
          مسار مختصر من تسجيل الدخول حتى تقديم المرحلتين.
        </p>
      </div>

      <div className="space-y-6">
        <Step n={1} title="سجّل دخولك عبر VMS">
          <p>استخدم حساب عضويتك في ابتكار. يجب أن تكون مسجّلاً في فعالية المطبخ.</p>
        </Step>
        <Step n={2} title="ادخل مطبخ الفعالية ثم «لوحتي»">
          <p>
            من الصفحة الرئيسية اختر الفعالية. في الشريط العلوي ستجد{' '}
            <strong className="text-white">لوحتي</strong> و{' '}
            <strong className="text-white">لوحة المتصدرين</strong>.
          </p>
        </Step>
        <Step n={3} title="انضم لفريق أو أنشئ فريقاً">
          <p>
            أنشئ فريقاً جديداً، أو انضم لفريق موجود، أو ادخل قائمة الانتظار (الفرد) ليفرزك المدير
            لاحقاً.
          </p>
          <Callout icon={Lock}>
            بعد دخولك فريقاً <strong className="text-white">لا يمكنك مغادرته أو تغييره بنفسك</strong>.
            النقل أو الإزالة من صلاحيات مدير الفعالية فقط.
          </Callout>
        </Step>
        <Step n={4} title="ثلاث خطوات في لوحتي">
          <ol className="list-decimal list-inside space-y-2 mr-1">
            <li>
              <strong className="text-white">اختيار المسابقة</strong> من مكتبة تكنوفيست — يمكن
              تغييرها قبل تقديم المرحلة الأولية فقط.
            </li>
            <li>
              <strong className="text-white">المرحلة الأولية</strong> — ملخص قصير + ملفات (حتى 10،
              كل ملف 10MB) مع اسم ووصف لكل ملف.
            </li>
            <li>
              <strong className="text-white">المرحلة النهائية</strong> — نفس الشكل، بعد تقديم
              الأولية.
            </li>
          </ol>
        </Step>
        <Step n={5} title="الدرجات">
          <p>
            كل مرحلة تُحكَّم على حدة. الدرجة الإجمالية للفريق ={' '}
            <strong className="text-white">40% أولية + 60% نهائية</strong>.
          </p>
        </Step>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Link to="/" className="btn-primary inline-flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4" />
          إلى المطابخ
        </Link>
        <span className="inline-flex items-center gap-2 text-xs text-gray-500 self-center">
          <UserPlus className="w-3.5 h-3.5" />
          المحكّمون لا يكونون أعضاءً في فرق
        </span>
      </div>
    </div>
  )
}

function JuryGuide() {
  return (
    <div className="card space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">للمحكّمين</h2>
        <p className="text-gray-400 text-sm">
          التحكيم فقط على الفرق المعيّنة لك، ولكل مرحلة تقديم مستقلة.
        </p>
      </div>

      <div className="space-y-6">
        <Step n={1} title="التعيين من المدير">
          <p>
            يعينك مدير الفعالية كمحكّم من المسجّلين في VMS، ثم يربطك بفرق محددة.
          </p>
          <Callout icon={Lock}>
            المحكّم <strong className="text-white">لا يكون عضواً في أي فريق</strong> في نفس
            الفعالية. والمدير لا يقيّم إلا إن عيّن نفسه محكّماً.
          </Callout>
        </Step>
        <Step n={2} title="افتح «لوحتي»">
          <p>
            لوحتي تعرض واجهة التحكيم تلقائياً إن كنت محكّماً: الفرق المعيّنة وتقديماه الأولية
            والنهائية.
          </p>
        </Step>
        <Step n={3} title="اطّلع ثم قيّم">
          <p>
            اعرض الملخص والملفات، ثم ضع درجة من 0 إلى 100 مع{' '}
            <strong className="text-white">ملاحظات إلزامية</strong>. يمكنك تعديل درجتك لاحقاً.
          </p>
        </Step>
        <Step n={4} title="كيف تُحسب الدرجة؟">
          <p>
            درجة المرحلة = متوسط درجات المحكّمين لتلك المرحلة. الإجمالي = 40% أولية + 60%
            نهائية.
          </p>
        </Step>
      </div>
    </div>
  )
}

function AdminGuide() {
  return (
    <div className="card space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">لمديري الفعالية</h2>
        <p className="text-gray-400 text-sm">
          صلاحياتك تأتي من كونك مدير فعالية في VMS — لا حاجة لحساب مطبخ منفصل.
        </p>
      </div>

      <div className="space-y-6">
        <Step n={1} title="تفعيل المطبخ ومتابعة الفرق">
          <p>
            من <strong className="text-white">إدارة</strong> فعّل مطبخ الفعالية، ثم تابع الفرق
            والأفراد والمشاريع والتقييمات.
          </p>
        </Step>
        <Step n={2} title="فرز الأفراد وإدارة الأعضاء">
          <p>
            افرز المنتظرين في القائمة إلى فرق. الأعضاء لا يغادرون بأنفسهم — من{' '}
            <strong className="text-white">إدارة الفرق</strong> يمكنك{' '}
            <strong className="text-white">إزالة</strong> أو{' '}
            <strong className="text-white">نقل</strong> أي عضو في أي وقت.
          </p>
          <Callout icon={ArrowLeftRight}>
            النقل بين الفرق صلاحية إدارية فقط؛ لا يوجد زر مغادرة للأعضاء.
          </Callout>
        </Step>
        <Step n={3} title="المحكمون">
          <p>
            عيّن محكّمين من مسجّلي الفعالية، ووزّع عليهم الفرق. لا يمكن تعيين من هو عضو في فريق.
            صفحة التقييمات للعرض فقط — الدرجات من المحكّمين.
          </p>
        </Step>
        <Step n={4} title="ماذا يرى الفريق؟">
          <p>
            مسابقة → مرحلة أولية (ملخص + ملفات) → مرحلة نهائية. المسابقة تُقفل بعد تقديم الأولية.
            الدرجة النهائية = 40% / 60%.
          </p>
        </Step>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/kitchens"
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <Shield className="w-4 h-4" />
          لوحة الإدارة
        </Link>
        <span className="inline-flex items-center gap-2 text-xs text-gray-500 self-center">
          <FileText className="w-3.5 h-3.5" />
          راجع أيضاً تبويبي الأعضاء والمحكّمين أعلاه
        </span>
      </div>
    </div>
  )
}
