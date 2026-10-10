import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function ProtectedLayout() {
  const location = useLocation()
  const { status, error, refreshSession } = useAuth()

  if (status === 'loading') {
    return <main className="page-container"><p role="status">Checking your session…</p></main>
  }
  if (status === 'error') {
    return (
      <main className="page-container">
        <section className="page-status-message" role="alert">
          <p>{error}</p>
          <button className="button button-secondary" type="button" onClick={refreshSession}>Retry</button>
        </section>
      </main>
    )
  }
  if (status !== 'authenticated') {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    const searchParams = new URLSearchParams(location.search)
    searchParams.set('mode', 'signin')
    searchParams.set('returnTo', returnTo)

    return <Navigate to={`/auth?${searchParams.toString()}`} replace />
  }

  return <Outlet />
}
