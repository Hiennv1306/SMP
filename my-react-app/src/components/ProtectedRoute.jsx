import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }) {
  const { session, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <section id="center">Dang xac thuc...</section>
  }

  if (!session) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children ?? <Outlet />
}
