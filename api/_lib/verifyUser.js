/**
 * verifyUser.js
 * Shared identity check for the Supabase-backed Node API routes.
 *
 * In production, the app's uid (see src/lib/authUtils.js: 'sso_' + custID) is
 * the same uid Firebase Auth signs the user in as after the SSO redirect
 * (App.jsx's EvokeAuthHandler -> signInWithCustomToken -> getOrCreateUser).
 * So a verified Firebase ID token gives us a trustworthy version of the exact
 * uid the rest of the app already uses — no new identity system needed.
 *
 * On localhost, the SSO flow never runs (useEvokeSession.js's DEV_PROFILE has
 * token: null), so there is no real Firebase session to verify — this mirrors
 * the app's existing dev-bypass convention (IS_LOCAL / IS_DEV) instead of
 * inventing a new one.
 */
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function getAdminApp() {
  if (getApps().length) return getApps()[0]
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  })
}

/**
 * Returns the trusted uid for this request, or null if it can't be determined.
 * @param {import('http').IncomingMessage & { body?: any }} req
 */
export async function verifyRequestUser(req) {
  const isProd = process.env.NODE_ENV === 'production'

  if (!isProd) {
    const devUid = req.body?.uid || req.query?.uid
    return devUid || null
  }

  const authHeader = req.headers?.authorization || ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) return null

  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken)
    return decoded.uid || null
  } catch {
    return null
  }
}
