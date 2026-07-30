/**
 * emailService.js
 * Thin client for the /api/send-email serverless function (Resend).
 */

/** Send an email. Throws with a user-facing message on failure. */
export async function sendEmail({ to, subject, html, text, from }) {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html, text, from }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || `Send failed (${res.status})`)
  }
  return data
}
