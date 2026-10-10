export const DEFAULT_PREFERENCES = Object.freeze({
  darkMode: false,
  courseReminders: true,
  weeklyDigest: true,
  progressHighlights: false,
});

export function applyPreferencesTheme(preferences = DEFAULT_PREFERENCES) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', preferences.darkMode ? 'dark' : 'light');
  }
}
