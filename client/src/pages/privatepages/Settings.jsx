import { useEffect, useState } from 'react'
import apiClient from '../../lib/api'
import { applyPreferencesTheme, DEFAULT_PREFERENCES } from '../../preferences/userPreferences'

const preferenceOptions = [
  { key: 'courseReminders', label: 'Course reminders', detail: 'Saved preference only; no email or push notification is sent.' },
  { key: 'weeklyDigest', label: 'Weekly digest', detail: 'Saved preference only; no digest is generated or sent.' },
  { key: 'progressHighlights', label: 'Progress highlights', detail: 'Saved preference only; no notification service is connected.' },
  { key: 'darkMode', label: 'Dark theme', detail: 'Apply a dark theme across the site and restore it after signing in.' },
]

export default function Settings() {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState('')
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('status')

  useEffect(() => {
    let active = true
    apiClient('/users/me/preferences')
      .then((response) => {
        if (!active) return
        setPreferences(response.data.preferences)
        applyPreferencesTheme(response.data.preferences)
      })
      .catch((error) => {
        if (active) {
          setStatus(error.message || 'Preferences could not be loaded.')
          setStatusType('alert')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  async function handleToggle(key) {
    const nextPreferences = { ...preferences, [key]: !preferences[key] }
    setSavingKey(key)
    setStatus('')
    setStatusType('status')
    try {
      const response = await apiClient('/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences: nextPreferences }),
      })
      setPreferences(response.data.preferences)
      applyPreferencesTheme(response.data.preferences)
      setStatus('Preference saved to your account. Notification options are saved only; nothing is sent.')
      setStatusType('status')
    } catch (error) {
      setStatus(error.message || 'Preference could not be saved.')
      setStatusType('alert')
    } finally {
      setSavingKey('')
    }
  }

  return (
    <main className="page-container settings-page">
      <header className="page-header settings-header" aria-labelledby="settings-title">
        <p className="eyebrow">Settings</p>
        <h1 id="settings-title">Tailor the experience to your learning routine.</h1>
        <p>Preferences are saved to your account and restored when you sign in.</p>
      </header>

      <p className="settings-demo-notice" role="note">
        Reminder and digest options are saved preferences only; no email or push notifications are delivered.
      </p>

      <section className="settings-panel" aria-labelledby="settings-preferences-title" aria-busy={loading}>
        <div className="settings-form">
          <div className="settings-form-heading">
            <div>
              <p className="eyebrow">Preferences</p>
              <h2 id="settings-preferences-title">Your choices</h2>
            </div>
            <span className="settings-storage-label">Account preferences</span>
          </div>

          {loading ? <p role="status">Loading preferences…</p> : preferenceOptions.map(({ key, label, detail }) => (
            <label className="toggle-row" key={key} htmlFor={`preference-${key}`}>
              <span className="toggle-row-copy">
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <input
                id={`preference-${key}`}
                name={key}
                type="checkbox"
                checked={preferences[key]}
                onChange={() => handleToggle(key)}
                disabled={Boolean(savingKey)}
              />
            </label>
          ))}
          {status && <p className="settings-status" role={statusType}>{status}</p>}
        </div>
      </section>
    </main>
  )
}
