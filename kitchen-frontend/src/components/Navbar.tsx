import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Menu, X, Home, Users, User, FileText, Trophy, LogIn, LogOut, Shield, Star } from 'lucide-react'
import Logo from './Logo'
import { clearSession, isLoggedIn, isStaffSession, getSession } from '../lib/auth-session'
import { kitchensService } from '../services/api'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasTeam, setHasTeam] = useState(false)
  const [isJury, setIsJury] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { eventId } = useParams()
  const loggedIn = isLoggedIn()
  const staff = isStaffSession()
  const session = getSession()

  useEffect(() => {
    if (!eventId || !loggedIn) {
      setHasTeam(false)
      setIsJury(false)
      return
    }
    let cancelled = false
    Promise.all([
      kitchensService.getMyTeam(eventId).catch(() => null),
      kitchensService.get(eventId).catch(() => null),
    ]).then(([team, kitchen]) => {
      if (cancelled) return
      setHasTeam(Boolean(team))
      setIsJury(Boolean(kitchen?.is_jury))
    })
    return () => {
      cancelled = true
    }
  }, [eventId, loggedIn, location.pathname])

  const navLinks = eventId
    ? [
        { to: `/events/${eventId}`, label: 'المطبخ', icon: Home },
        { to: `/events/${eventId}/register/team`, label: 'التقديم كفريق', icon: Users },
        { to: `/events/${eventId}/register/individual`, label: 'التقديم كفرد', icon: User },
        ...(hasTeam
          ? [{ to: `/events/${eventId}/project/submit`, label: 'تقديم مشروع', icon: FileText }]
          : []),
        ...(isJury
          ? [{ to: `/events/${eventId}/jury`, label: 'تحكيم', icon: Star }]
          : []),
        { to: `/events/${eventId}/top-teams`, label: 'أفضل الفرق', icon: Trophy },
      ]
    : [{ to: '/', label: 'الرئيسية', icon: Home }]

  const logout = () => {
    clearSession()
    navigate('/')
  }

  return (
    <nav className="bg-teknofest-dark-blue/90 backdrop-blur-md border-b border-teknofest-light-blue/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo size="md" className="transform group-hover:scale-110 transition-transform" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">تكنوفيست</h1>
              <p className="text-xs text-teknofest-cyan">TEKNOFEST</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-teknofest-orange text-white'
                      : 'text-gray-300 hover:bg-teknofest-medium-blue hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {staff ? (
              <Link
                to="/admin/kitchens"
                className="flex items-center gap-2 px-4 py-2 border border-teknofest-cyan text-teknofest-cyan rounded-lg hover:bg-teknofest-cyan hover:text-teknofest-dark-blue transition-all duration-300"
              >
                <Shield className="w-4 h-4" />
                <span>إدارة المطابخ</span>
              </Link>
            ) : null}

            {loggedIn ? (
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white rounded-lg hover:bg-teknofest-medium-blue transition-all"
                title={session?.user.email}
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-teknofest-orange text-white rounded-lg hover:opacity-90 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>دخول</span>
              </Link>
            )}
          </div>

          <button
            type="button"
            className="lg:hidden p-2 text-gray-300"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="lg:hidden border-t border-teknofest-light-blue/20 px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-teknofest-medium-blue"
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            )
          })}
          {staff ? (
            <Link
              to="/admin/kitchens"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-teknofest-cyan hover:bg-teknofest-medium-blue"
            >
              <Shield className="w-4 h-4" />
              إدارة المطابخ
            </Link>
          ) : null}
        </div>
      ) : null}
    </nav>
  )
}
