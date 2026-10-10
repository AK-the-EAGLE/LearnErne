import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import logo from '../assets/learnerne-logo.png'

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/how-it-works', label: 'How it works' },
]

const learnerLinks = [
  { to: '/courses', label: 'Courses' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
]

export default function StickyHeader() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { status, user, signOut, refreshSession } = useAuth()
  const [signOutError, setSignOutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const [openMenuPath, setOpenMenuPath] = useState(null)
  const menuOpen = openMenuPath === pathname
  const menuButtonRef = useRef(null)

  useEffect(() => {
    function closeMenuOnHistoryNavigation() {
      setOpenMenuPath(null)
    }

    window.addEventListener('popstate', closeMenuOnHistoryNavigation)
    return () => window.removeEventListener('popstate', closeMenuOnHistoryNavigation)
  }, [])

  useEffect(() => {
    if (!menuOpen) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpenMenuPath(null)
        menuButtonRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    setSignOutError('')
    try {
      await signOut()
      setOpenMenuPath(null)
      navigate('/', { replace: true })
      await refreshSession()
    } catch (error) {
      setSignOutError(error.message || 'Unable to sign out. Please try again.')
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky-header">
      <div className="header-inner">
        <Link className="brand-link" to="/" aria-label="LearnErne home" onClick={() => setOpenMenuPath(null)}>
          <img className="brand-logo" src={logo} alt="LearnErne — Learn what you need. Next." />
        </Link>

        <button
          ref={menuButtonRef}
          className="header-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setOpenMenuPath((openPath) => openPath === pathname ? null : pathname)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="main-navigation"
          className={menuOpen ? 'header-nav is-open' : 'header-nav'}
          aria-label="Main navigation"
        >
          <div className="header-nav-links">
            {publicLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                className={({ isActive }) => isActive ? 'header-link is-active' : 'header-link'}
                to={to}
                end
                onClick={() => setOpenMenuPath(null)}
              >
                {label}
              </NavLink>
            ))}
            {status === 'authenticated' && learnerLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                className={({ isActive }) => isActive ? 'header-link is-active' : 'header-link'}
                to={to}
                end
                onClick={() => setOpenMenuPath(null)}
              >
                {label}
              </NavLink>
            ))}
          </div>
          <div className="header-nav-actions">
            {status === 'authenticated' ? (
              <>
                <span className="header-user-greeting">
                  {user?.displayName || user?.email}
                </span>
                <button className="header-signout" type="button" onClick={handleSignOut} disabled={signingOut}>
                  {signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <Link className="header-signin" to="/auth?mode=signin" onClick={() => setOpenMenuPath(null)}>
                  Sign in
                </Link>
                <Link className="header-get-started" to="/auth?mode=signup" onClick={() => setOpenMenuPath(null)}>
                  Get started
                </Link>
              </>
            )}
          </div>
          {signOutError && <p className="header-action-error" role="alert">{signOutError}</p>}
        </nav>
      </div>
    </header>
  )
}
