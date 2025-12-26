import { Navigate, Outlet, useLocation } from "react-router-dom"
import { authClient } from "../../lib/auth-client"

/**
 * GuestRoute - Layout route accessible only without authentication
 * Redirects authenticated users to home or their intended destination
 * Use as a pathless layout route to protect auth pages
 */
export default function GuestRoute() {
  const { data: session, isPending } = authClient.useSession()
  const location = useLocation()

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className='auth-loading'>
        <span>Loading...</span>
      </div>
    )
  }

  // Redirect authenticated users to their intended destination or home
  if (session?.user) {
    const from = location.state?.from?.pathname || "/home"
    return <Navigate to={from} replace />
  }

  return <Outlet />
}
