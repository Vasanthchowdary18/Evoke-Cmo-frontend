/**
 * userService.js
 * Handles all Firestore operations for user profiles, token balances,
 * social account connections, and onboarding state.
 */

import {
  doc, getDoc, setDoc, updateDoc, increment, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'

// ─── User document structure ───────────────────────────────────────────────
// users/{uid}:
//   tokenBalance: number
//   socialAccounts: { facebook, instagram, linkedin, whatsapp }
//   onboardingComplete: boolean
//   onboardingData: { background, industry, goal }
//   createdAt: timestamp

/**
 * Fetches the user doc from Firestore.
 * If no doc exists (first login), creates one with default values.
 * Returns the user data object.
 */
export async function getOrCreateUser(uid, displayName, email) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: displayName || '',
      email: email || '',
      tokenBalance: 0,
      socialAccounts: {
        facebook:  { connected: false, pageId: '', pageAccessToken: '', pageName: '' },
        instagram: { connected: false, businessAccountId: '', pageName: '' },
        linkedin:  { connected: false, personUrn: '', accessToken: '', name: '' },
        twitter:   { connected: false, accessToken: '', username: '', userId: '' },
        whatsapp:  { connected: false, phoneNumberId: '', accessToken: '' },
        gmail:     { connected: false, email: '' },
      },
      onboardingComplete: false,
      createdAt: serverTimestamp(),
    })
    return { tokenBalance: 0, socialAccounts: {}, onboardingComplete: false }
  }
  return snap.data()
}

/** Saves the chat onboarding answers (background/industry/goal). Does NOT mark onboardingComplete — that is set by SetupPage after brand setup. */
export async function saveChatOnboardingData(uid, data) {
  await updateDoc(doc(db, 'users', uid), {
    chatOnboardingDone: true,
    onboardingData: data,
    chatOnboardingCompletedAt: serverTimestamp(),
  })
}

/** Saves completed onboarding answers and marks onboarding as done. */
export async function saveOnboardingData(uid, data) {
  await updateDoc(doc(db, 'users', uid), {
    onboardingComplete: true,
    onboardingData: data,
    onboardingCompletedAt: serverTimestamp(),
  })
}

/** Returns the full user document, or null if the user doesn't exist. */
export async function getUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

/** Returns the user's current token balance (defaults to 0 if not found). */
export async function getTokenBalance(uid) {
  const data = await getUserData(uid)
  return data?.tokenBalance ?? 0
}

/** Adds tokens to the user's balance (used after a purchase). */
export async function addTokens(uid, amount) {
  await updateDoc(doc(db, 'users', uid), {
    tokenBalance: increment(amount),
  })
}

/**
 * Deducts 1 token when a campaign is launched.
 * Throws if the user has no tokens remaining.
 */
export async function deductToken(uid) {
  const data = await getUserData(uid)
  if (!data || data.tokenBalance < 1) throw new Error('Insufficient tokens')
  await updateDoc(doc(db, 'users', uid), {
    tokenBalance: increment(-1),
  })
}

/** Saves a connected social account's credentials under the user's profile. */
export async function saveSocialAccount(uid, platform, accountData) {
  await updateDoc(doc(db, 'users', uid), {
    [`socialAccounts.${platform}`]: { connected: true, ...accountData },
  })
}

/** Marks a social account as disconnected (clears connected flag). */
export async function disconnectSocialAccount(uid, platform) {
  await updateDoc(doc(db, 'users', uid), {
    [`socialAccounts.${platform}`]: { connected: false },
  })
}

/** Returns all social accounts linked to the user. */
export async function getSocialAccounts(uid) {
  const data = await getUserData(uid)
  return data?.socialAccounts || {}
}

// Token packages available for purchase
export const TOKEN_PACKAGES = [
  {
    id:       'starter',
    tokens:   10,
    price:    9.99,
    label:    'Starter',
    popular:  false,
    color:    '#7c3aed',
    perToken: '$0.99',
    features: ['10 AI campaigns', 'All platforms', 'Email + WhatsApp', 'LinkedIn + Instagram'],
  },
  {
    id:       'growth',
    tokens:   20,
    price:    17.99,
    label:    'Growth',
    popular:  true,
    color:    '#06b6d4',
    perToken: '$0.89',
    features: ['20 AI campaigns', 'All platforms', 'Priority generation', '7-day calendar'],
  },
  {
    id:       'pro',
    tokens:   35,
    price:    24.99,
    label:    'Pro',
    popular:  false,
    color:    '#a855f7',
    perToken: '$0.71',
    features: ['35 AI campaigns', 'All platforms', 'Best value', 'Full brand strategy'],
  },
]
