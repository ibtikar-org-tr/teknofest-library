import { Navigate, Outlet, useLocation } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { isLoggedIn, isStaffSession } from '../lib/auth-session'

/** Requires VMS event-manager access (can enable/manage kitchens for their events). */
export default function ProtectedRoute() {
  const location = useLocation()

  if (!isLoggedIn()) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  if (!isStaffSession()) {
    return <Navigate to="/" replace />
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  )
}
