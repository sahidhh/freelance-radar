/** Builds a mailto: URL. No OAuth, no send — the browser opens the user's default mail client. */
export function buildMailto(to: string, subject: string, body: string): string {
  const params = new URLSearchParams()
  if (subject) params.set("subject", subject)
  if (body) params.set("body", body)
  const query = params.toString()
  return `mailto:${to.trim()}${query ? `?${query}` : ""}`
}
