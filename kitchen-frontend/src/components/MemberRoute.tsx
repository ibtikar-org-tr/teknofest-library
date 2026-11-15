import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isLoggedIn } from '../lib/auth-session'

/** Requires any logged-in VMS member (forms / kitchen). */
export default function MemberRoute() {
  const location = useLocation()

  if (!isLoggedIn()) {
    const next = `${location.pathname}${location.search}`
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }

  return <Outlet />
}
