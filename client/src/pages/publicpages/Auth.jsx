import { useEffect, useRef, useState } from 'react'
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { getSafeReturnPath } from '../../auth/returnPath'
import illustration from '../../assets/illustration.svg'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const minimumPasswordLength = 8

function validateField(name, value, values) {
  const trimmedValue = value.trim()

  if (name === 'fullName' && !trimmedValue) {
    return 'Enter your full name.'
  }

  if (name === 'email') {
    if (!trimmedValue) {
      return 'Enter your email address.'
    }
    if (!emailPattern.test(trimmedValue)) {
      return 'Enter an email address in the format name@example.com.'
    }
  }

  if (name === 'password') {
    if (!value) {
      return 'Enter a password.'
    }
    if (value.length < minimumPasswordLength) {
      return `Use at least ${minimumPasswordLength} characters.`
    }
    if (value.length > 128) {
      return 'Use 128 characters or fewer.'
    }
  }

  if (name === 'confirmPassword') {
    if (!value) {
      return 'Confirm your password.'
    }
    if (value !== values.password) {
      return 'Your passwords do not match.'
    }
  }

  return ''
}

function AuthInput({
  id,
  name,
  label,
  icon: Icon,
  error,
  inputRef,
  showPassword,
  onTogglePassword,
  ...inputProps
}) {
  const errorId = `${id}-error`

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className={error ? 'auth-input-wrap has-error' : 'auth-input-wrap'}>
        <Icon aria-hidden="true" />
        <input
          id={id}
          name={name}
          ref={inputRef}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        {onTogglePassword && (
          <button
            className="password-visibility"
            type="button"
            disabled={inputProps.disabled}
            aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={showPassword}
            onClick={onTogglePassword}
          >
            {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && <p className="auth-field-error" id={errorId}>{error}</p>}
    </div>
  )
}

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const isSignUp = searchParams.get('mode') !== 'signin'
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRefs = useRef({})

  useEffect(() => {
    const currentMode = searchParams.get('mode')
    if (currentMode === 'signin' || currentMode === 'signup') {
      return
    }

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('mode', 'signup')
    if (nextSearchParams.has('returnTo')) {
      nextSearchParams.set('returnTo', getSafeReturnPath(nextSearchParams.get('returnTo')))
    }
    setSearchParams(nextSearchParams, { replace: true })
  }, [searchParams, setSearchParams])

  function changeMode(nextMode) {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('mode', nextMode)
    if (nextSearchParams.has('returnTo')) {
      nextSearchParams.set('returnTo', getSafeReturnPath(nextSearchParams.get('returnTo')))
    }
    setSearchParams(nextSearchParams)
    setErrors({})
    setStatus(null)
    setShowPassword(false)
  }

  function handleFieldBlur(event) {
    const { name, value } = event.currentTarget
    const form = event.currentTarget.form
    const formData = new FormData(form)
    const values = Object.fromEntries(formData.entries())
    const error = validateField(name, value, values)

    setErrors((current) => ({ ...current, [name]: error }))
  }

  function handleFieldChange(event) {
    const { name } = event.currentTarget
    setErrors((current) => current[name] ? { ...current, [name]: '' } : current)
    setStatus(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form).entries())
    const fieldNames = isSignUp
      ? ['fullName', 'email', 'password', 'confirmPassword']
      : ['email', 'password']
    const nextErrors = Object.fromEntries(
      fieldNames.map((name) => [name, validateField(name, String(values[name] ?? ''), values)]),
    )

    setErrors(nextErrors)
    const firstInvalidField = fieldNames.find((name) => nextErrors[name])
    if (firstInvalidField) {
      setStatus({ type: 'error', text: 'Review the highlighted fields and try again.' })
      inputRefs.current[firstInvalidField]?.focus()
      return
    }

    setIsSubmitting(true)
    setStatus({ type: 'info', text: isSignUp ? 'Creating your account…' : 'Signing in…' })

    try {
      if (isSignUp) {
        await signUp({
          displayName: String(values.fullName).trim(),
          email: String(values.email).trim(),
          password: String(values.password),
        })
      } else {
        await signIn({
          email: String(values.email).trim(),
          password: String(values.password),
        })
      }
      setStatus({
        type: 'success',
        text: isSignUp ? 'Your account has been created.' : 'You are signed in.',
      })
      navigate(getSafeReturnPath(searchParams.get('returnTo')), { replace: true })
    } catch (error) {
      setIsSubmitting(false)
      setStatus({
        type: 'error',
        text: error.message || 'Unable to complete this request. Please try again.',
      })
    }
  }

  function showPasswordResetUnavailable() {
    setStatus({
      type: 'info',
      text: 'Password reset is unavailable because this application does not have a password-reset service or email delivery configured.',
    })
  }

  const panelClassName = isSignUp ? 'auth-panel signup-panel' : 'auth-panel signin-panel'

  return (
    <main className="page-container auth-page">
      <section className={`auth-card auth-switch-card ${isSignUp ? 'signup-active' : 'signin-active'}`}>
        <div className={panelClassName}>
          <div className="auth-card-heading">
            <p className="eyebrow">{isSignUp ? 'Start learning' : 'Welcome back'}</p>
            <h1>{isSignUp ? 'Create your account' : 'Sign in'}</h1>
            <p className="auth-intro">
              Create an account or sign in to access your learner space. Passwords are securely hashed on the server.
            </p>
          </div>

          <form
            className="auth-form auth-switch-form"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={isSubmitting}
          >
            {isSignUp && (
              <AuthInput
                id="signup-name"
                name="fullName"
                label="Full name"
                icon={FiUser}
                error={errors.fullName}
                inputRef={(element) => { inputRefs.current.fullName = element }}
                type="text"
                autoComplete="name"
                placeholder="Your name"
                required
                disabled={isSubmitting}
                onBlur={handleFieldBlur}
                onChange={handleFieldChange}
              />
            )}
            <AuthInput
              id={`${isSignUp ? 'signup' : 'signin'}-email`}
              name="email"
              label="Email address"
              icon={FiMail}
              error={errors.email}
              inputRef={(element) => { inputRefs.current.email = element }}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
              onBlur={handleFieldBlur}
              onChange={handleFieldChange}
            />
            <AuthInput
              id={`${isSignUp ? 'signup' : 'signin'}-password`}
              name="password"
              label="Password"
              icon={FiLock}
              error={errors.password}
              inputRef={(element) => { inputRefs.current.password = element }}
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder={isSignUp ? 'Create a password' : 'Enter a password'}
              required
              minLength={minimumPasswordLength}
              maxLength={128}
              disabled={isSubmitting}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((visible) => !visible)}
              onBlur={handleFieldBlur}
              onChange={handleFieldChange}
            />
            {isSignUp && (
              <AuthInput
                id="signup-confirm-password"
                name="confirmPassword"
                label="Confirm password"
                icon={FiLock}
                error={errors.confirmPassword}
                inputRef={(element) => { inputRefs.current.confirmPassword = element }}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter your password again"
                required
                minLength={minimumPasswordLength}
                maxLength={128}
                disabled={isSubmitting}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((visible) => !visible)}
                onBlur={handleFieldBlur}
                onChange={handleFieldChange}
              />
            )}
            {!isSignUp && (
              <button
                className="auth-forgot-link"
                type="button"
                onClick={showPasswordResetUnavailable}
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            )}
            <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? (isSignUp ? 'Creating account…' : 'Signing in…')
                : isSignUp
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          {status && (
            <p className={`form-message auth-message auth-message-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
              {status.text}
            </p>
          )}

          <p className="auth-footnote">
            {isSignUp ? 'Already have an account?' : 'New to LearnErne?'}{' '}
            <button
              className="auth-mode-link"
              type="button"
              onClick={() => changeMode(isSignUp ? 'signin' : 'signup')}
              disabled={isSubmitting}
            >
              {isSignUp ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>

        <div className="auth-illustration" aria-hidden="true">
          <img src={illustration} alt="" />
        </div>
      </section>
    </main>
  )
}
