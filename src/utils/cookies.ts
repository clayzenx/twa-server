/**
 * Parses a Cookie header string into an object map of cookie names to values.
 * @param header Optional Cookie header string
 * @returns Record of cookie name to decoded value
 */
export function parseCookies(header?: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!header) return cookies
  header.split(';').forEach(cookie => {
    const parts = cookie.split('=')
    const name = parts.shift()?.trim()
    const val = parts.join('=').trim()
    if (name) cookies[name] = decodeURIComponent(val)
  })
  return cookies
}