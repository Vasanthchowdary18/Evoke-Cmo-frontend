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

export async function getOrCreateUser(uid, displayName, email) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: displayName || '',
      email: email || '',
      tokenBalance: 0,
      egtBalance: 0,
      walletAddress: '',
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

export async function saveOnboardingData(uid, data) {
  await updateDoc(doc(db, 'users', uid), {
    onboardingComplete: true,
    onboardingData: data,
    onboardingCompletedAt: serverTimestamp(),
  })
}

export async function getUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function getTokenBalance(uid) {
  const data = await getUserData(uid)
  return data?.tokenBalance ?? 0
}

export async function addTokens(uid, amount) {
  await updateDoc(doc(db, 'users', uid), {
    tokenBalance: increment(amount),
  })
}

export async function deductToken(uid) {
  const data = await getUserData(uid)
  if (!data || data.tokenBalance < 1) throw new Error('Insufficient tokens')
  await updateDoc(doc(db, 'users', uid), {
    tokenBalance: increment(-1),
  })
}

// ─── EGT Token functions ───────────────────────────────────────────────────
export async function getEGTBalance(uid) {
  const data = await getUserData(uid)
  return data?.egtBalance ?? 0
}

export async function deductEGT(uid, amount) {
  const data = await getUserData(uid)
  const current = data?.egtBalance ?? 0
  if (current < amount) throw new Error(`Insufficient EGT. Need ${amount}, have ${current}.`)
  await updateDoc(doc(db, 'users', uid), { egtBalance: increment(-amount) })
}

export async function addEGT(uid, amount) {
  await updateDoc(doc(db, 'users', uid), { egtBalance: increment(amount) })
}

export async function saveWalletAddress(uid, address) {
  await updateDoc(doc(db, 'users', uid), { walletAddress: address })
}

export async function getWalletAddress(uid) {
  const data = await getUserData(uid)
  return data?.walletAddress || ''
}

export async function saveSocialAccount(uid, platform, accountData) {
  await updateDoc(doc(db, 'users', uid), {
    [`socialAccounts.${platform}`]: { connected: true, ...accountData },
  })
}

export async function disconnectSocialAccount(uid, platform) {
  await updateDoc(doc(db, 'users', uid), {
    [`socialAccounts.${platform}`]: { connected: false },
  })
}

export async function getSocialAccounts(uid) {
  const data = await getUserData(uid)
  return data?.socialAccounts || {}
}

// Token packages on offer
export const TOKEN_PACKAGES = [
  {
    id:       'starter',
    tokens:   10,
    price:    999,
    label:    'Starter',
    popular:  false,
    color:    '#7c3aed',
    perToken: '₹99.9',
    features: ['10 AI campaigns', 'All platforms', 'Email + WhatsApp', 'LinkedIn + Instagram'],
  },
  {
    id:       'growth',
    tokens:   20,
    price:    1799,
    label:    'Growth',
    popular:  true,
    color:    '#06b6d4',
    perToken: '₹89.9',
    features: ['20 AI campaigns', 'All platforms', 'Priority generation', '7-day calendar'],
  },
  {
    id:       'pro',
    tokens:   35,
    price:    2499,
    label:    'Pro',
    popular:  false,
    color:    '#a855f7',
    perToken: '₹71.4',
    features: ['35 AI campaigns', 'All platforms', 'Best value', 'Full brand strategy'],
  },
]
