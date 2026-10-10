import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import apiClient from '../../lib/api'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const savedProfile = {
    fullName: user.displayName,
    email: user.email,
    role: user.profile.interest,
    location: user.profile.location,
    bio: user.profile.bio,
  }
  const [profile, setProfile] = useState(savedProfile)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('status')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
    setDirty(true)
    setStatus('')
    setStatusType('status')
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function validateProfile() {
    const nextErrors = {}
    if (!profile.fullName.trim()) {
      nextErrors.fullName = 'Enter your name.'
    } else if (profile.fullName.trim().length > 80) {
      nextErrors.fullName = 'Use 80 characters or fewer.'
    }

    if (!profile.email.trim()) {
      nextErrors.email = 'Enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      nextErrors.email = 'Enter an email address in the format name@example.com.'
    } else if (profile.email.trim().length > 254) {
      nextErrors.email = 'Use an email address with 254 characters or fewer.'
    }

    if (profile.role.trim().length > 80) {
      nextErrors.role = 'Use 80 characters or fewer.'
    }

    if (profile.location.trim().length > 80) {
      nextErrors.location = 'Use 80 characters or fewer.'
    }

    if (profile.bio.trim().length > 500) {
      nextErrors.bio = 'Use 500 characters or fewer.'
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateProfile()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatus('')
      document.getElementById(Object.keys(nextErrors)[0])?.focus()
      return
    }

    if (!dirty) {
      setStatus('There are no profile changes to save.')
      return
    }

    setSaving(true)
    try {
      const response = await apiClient('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: profile.fullName.trim(),
          bio: profile.bio.trim(),
          location: profile.location.trim(),
          interest: profile.role.trim(),
        }),
      })
      updateUser(response.data.user)
      setProfile({
        fullName: response.data.user.displayName,
        email: response.data.user.email,
        role: response.data.user.profile.interest,
        location: response.data.user.profile.location,
        bio: response.data.user.profile.bio,
      })
      setDirty(false)
      setStatus('Profile changes saved.')
      setStatusType('status')
    } catch (error) {
      setStatus(error.message || 'Profile changes could not be saved.')
      setStatusType('alert')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setProfile(savedProfile)
    setErrors({})
    setDirty(false)
    setStatus('Unsaved changes discarded.')
  }

  function fieldError(name) {
    return errors[name] ? `${name}-error` : undefined
  }

  return (
    <main className="page-container profile-page">
      <header className="page-header profile-header" aria-labelledby="profile-title">
        <p className="eyebrow">Profile</p>
        <h1 id="profile-title">Keep your learning profile clear and current.</h1>
      </header>

      <p className="profile-demo-notice" role="note">
        Profile details are stored with your account. Your password and authentication data are not part of this profile.
      </p>

      <section className="profile-grid" aria-label="Profile details and editor">
        <section className="profile-card profile-summary-card" aria-labelledby="profile-summary-title">
          <p className="eyebrow">Profile preview</p>
          <div className="profile-avatar" aria-hidden="true">
            {profile.fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'}
          </div>
          <h2 id="profile-summary-title">{profile.fullName || 'Your name'}</h2>
          <p>{profile.role || 'Add a role or learning interest'}</p>
          <dl className="profile-meta-list">
            <div>
              <dt>Location</dt>
              <dd>{profile.location || 'Not added'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
          </dl>
          {profile.bio && <p className="profile-preview-bio">{profile.bio}</p>}
        </section>

        <form className="profile-card profile-form-card" onSubmit={handleSubmit} noValidate>
          <div className="profile-form-heading">
            <div>
              <p className="eyebrow">Your details</p>
              <h2>Edit profile</h2>
            </div>
            <span className="profile-form-note">Your sign-in email cannot be changed here. Passwords and authentication secrets are never included in this profile.</span>
          </div>

          <div className="profile-form-grid">
            {[
              { name: 'fullName', label: 'Full name', type: 'text', required: true, maxLength: 80, autoComplete: 'name' },
              { name: 'role', label: 'Role or learning interest', type: 'text', maxLength: 80 },
              { name: 'location', label: 'Location', type: 'text', maxLength: 80, autoComplete: 'address-level2' },
            ].map(({ name, label, type, required, maxLength, autoComplete }) => (
              <label key={name} className="profile-field" htmlFor={name}>
                <span>{label}{required && <span aria-hidden="true"> *</span>}</span>
                <input
                  id={name}
                  name={name}
                  type={type}
                  value={profile[name]}
                  onChange={handleChange}
                  required={required}
                  maxLength={maxLength}
                  autoComplete={autoComplete}
                  aria-invalid={Boolean(errors[name])}
                  aria-describedby={fieldError(name)}
                />
                {errors[name] && <span className="profile-field-error" id={fieldError(name)}>{errors[name]}</span>}
              </label>
            ))}
          </div>

          <label className="profile-bio-field profile-field" htmlFor="bio">
            <span>Bio</span>
            <textarea
              id="bio"
              name="bio"
              rows="5"
              maxLength="500"
              value={profile.bio}
              onChange={handleChange}
              aria-invalid={Boolean(errors.bio)}
              aria-describedby={fieldError('bio')}
            />
            <span className="profile-character-count">{profile.bio.length}/500 characters</span>
            {errors.bio && <span className="profile-field-error" id={fieldError('bio')}>{errors.bio}</span>}
          </label>

          <div className="profile-form-actions">
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button className="button button-secondary profile-reset-button" type="button" onClick={handleReset} disabled={!dirty}>
              Discard changes
            </button>
          </div>
          {status && <p className="page-status-message" role={statusType}>{status}</p>}
        </form>
      </section>
    </main>
  )
}
