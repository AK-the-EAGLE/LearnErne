const PRIVATE_PATHS = new Set(['/courses', '/dashboard', '/profile', '/settings']);

export function getSafeReturnPath(value) {
  if (
    typeof value !== 'string'
    || !value.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || [...value].some((character) => character.charCodeAt(0) <= 0x1f)
  ) return '/dashboard';

  try {
    const destination = new URL(value, window.location.origin);
    if (
      destination.origin !== window.location.origin
      || destination.username
      || destination.password
      || !PRIVATE_PATHS.has(destination.pathname)
    ) return '/dashboard';
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return '/dashboard';
  }
}
