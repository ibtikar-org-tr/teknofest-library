import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Home, Users, User, FileText, Trophy, LogIn, LogOut, Shield } from 'lucide-react'
import Logo from './Logo'
import { clearSession, isLoggedIn, isStaffSession, getSession } from '../lib/auth-session'

const navLinks = [
  { to: '/', label: 'الرئيسية', icon: Home },
  { to: '/register/team', label: 'تسجيل فريق', icon: Users },
  { to: '/register/individual', label: 'تسجيل فردي', icon: User },
  { to: '/project/submit', label: 'تقديم مشروع', icon: FileText },
  { to: '/top-teams', label: 'أفضل الفرق', icon: Trophy },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const staff = isStaffSession()
  const session = getSession()

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
                to="/admin"
                className="flex items-center gap-2 px-4 py-2 border border-teknofest-cyan text-teknofest-cyan rounded-lg hover:bg-teknofest-cyan hover:text-teknofest-dark-blue transition-all duration-300"
              >
                <Shield className="w-4 h-4" />
                <span>لوحة الإدارة</span>
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
                className="flex items-center gap-2 px-4 py-2 border border-teknofest-cyan text-teknofest-cyan rounded-lg hover:bg-teknofest-cyan hover:text-teknofest-dark-blue transition-all duration-300"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-300 hover:bg-teknofest-medium-blue"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden py-4 border-t border-teknofest-light-blue/20">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-teknofest-orange text-white'
                        : 'text-gray-300 hover:bg-teknofest-medium-blue'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </Link>
                )
              })}
              {staff ? (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 mt-2 border border-teknofest-cyan text-teknofest-cyan rounded-lg"
                >
                  <Shield className="w-5 h-5" />
                  <span>لوحة الإدارة</span>
                </Link>
              ) : null}
              {loggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    logout()
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-gray-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span>خروج</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 mt-2 border border-teknofest-cyan text-teknofest-cyan rounded-lg"
                >
                  <LogIn className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
