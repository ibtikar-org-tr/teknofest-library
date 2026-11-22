import { useState, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  User,
  Gavel,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Calendar,
  BookOpen,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import Logo from './Logo'
import { clearSession } from '../lib/auth-session'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface SidebarContentProps {
  sidebarOpen: boolean
  pathname: string
  eventId?: string
  onLogout: () => void
  onNavigate?: () => void
  showClose?: boolean
  onClose?: () => void
}

function SidebarContent({
  sidebarOpen,
  pathname,
  eventId,
  onLogout,
  onNavigate,
  showClose,
  onClose,
}: SidebarContentProps) {
  const sidebarLinks = useMemo(() => {
    const links = [
      { to: '/admin/kitchens', label: 'المطابخ / الفعاليات', icon: Calendar },
      { to: '/instructions?tab=admin', label: 'التعليمات', icon: BookOpen },
    ]
    if (eventId) {
      const base = `/admin/events/${eventId}`
      links.push(
        { to: base, label: 'لوحة التحكم', icon: LayoutDashboard },
        { to: `${base}/teams`, label: 'الفرق', icon: Users },
        { to: `${base}/individuals`, label: 'الأفراد', icon: User },
        { to: `${base}/competitions`, label: 'المسابقات', icon: Trophy },
        { to: `${base}/juries`, label: 'المحكمون', icon: Gavel },
      )
    }
    return links
  }, [eventId])

  return (
    <>
      <div className="p-4 sm:p-6 border-b border-teknofest-light-blue/20 flex items-center justify-between gap-2">
        <Link
          to="/admin/kitchens"
          onClick={onNavigate}
          className="flex items-center gap-3 min-w-0"
        >
          <Logo size="sm" />
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">تكنوفيست</h1>
              <p className="text-xs text-teknofest-cyan">لوحة الإدارة</p>
            </div>
          )}
        </Link>
        {showClose ? (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-gray-300 hover:bg-teknofest-medium-blue"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
        <ul className="space-y-1.5">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const isDashboard = Boolean(eventId) && link.to === `/admin/events/${eventId}`
            const isActive = isDashboard
              ? pathname === link.to
              : pathname === link.to || pathname.startsWith(`${link.to}/`)
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 px-4 py-3 min-h-11 rounded-lg transition-all ${
                    isActive
                      ? 'bg-teknofest-orange text-white'
                      : 'text-gray-300 hover:bg-teknofest-medium-blue'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="font-medium">{link.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-3 sm:p-4 border-t border-teknofest-light-blue/20">
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 min-h-11 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="font-medium">تسجيل الخروج</span>}
        </button>
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 w-full px-4 py-3 min-h-11 mt-1 text-teknofest-cyan hover:bg-teknofest-cyan/10 rounded-lg transition-all"
        >
          <ChevronLeft className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="font-medium">العودة للموقع</span>}
        </Link>
      </div>
    </>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const eventId = location.pathname.match(/\/admin\/events\/([^/]+)/)?.[1]

  const handleLogout = () => {
    clearSession()
    setMobileOpen(false)
    navigate('/login')
  }

  const pageMeta: { title: string; icon: LucideIcon } = (() => {
    if (location.pathname === '/admin/kitchens') {
      return { title: 'المطابخ / الفعاليات', icon: Calendar }
    }
    if (location.pathname.includes('/teams')) return { title: 'الفرق', icon: Users }
    if (location.pathname.includes('/individuals')) return { title: 'الأفراد', icon: User }
    if (location.pathname.includes('/competitions')) {
      return { title: 'المسابقات', icon: Trophy }
    }
    if (location.pathname.includes('/juries')) return { title: 'المحكمون', icon: Gavel }
    if (eventId && location.pathname === `/admin/events/${eventId}`) {
      return { title: 'لوحة التحكم', icon: LayoutDashboard }
    }
    return { title: 'لوحة الإدارة', icon: LayoutDashboard }
  })()
  const PageIcon = pageMeta.icon

  return (
    <div className="min-h-[100dvh] min-h-screen bg-teknofest-dark-blue flex">
      <aside
        className={`hidden lg:flex flex-col bg-teknofest-blue border-l border-teknofest-light-blue/20 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <SidebarContent
          sidebarOpen={sidebarOpen}
          pathname={location.pathname}
          eventId={eventId}
          onLogout={handleLogout}
        />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-[min(18rem,88vw)] max-w-xs bg-teknofest-blue flex flex-col shadow-2xl">
            <SidebarContent
              sidebarOpen={true}
              pathname={location.pathname}
              eventId={eventId}
              onLogout={handleLogout}
              onNavigate={() => setMobileOpen(false)}
              showClose
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-teknofest-blue/80 backdrop-blur-md border-b border-teknofest-light-blue/20 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-gray-300 hover:bg-teknofest-medium-blue"
                aria-label="فتح القائمة"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-gray-300 hover:bg-teknofest-medium-blue"
                aria-label={sidebarOpen ? 'طي الشريط الجانبي' : 'توسيع الشريط الجانبي'}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="hidden sm:inline-flex w-9 h-9 rounded-xl bg-teknofest-orange/15 text-teknofest-orange items-center justify-center shrink-0">
                  <PageIcon className="w-4 h-4" />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                  {pageMeta.title}
                </h2>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
