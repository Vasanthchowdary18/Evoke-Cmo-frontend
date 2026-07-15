import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

// Saves inside the existing users/{uid} document as a nested field
// — avoids subcollection permission issues.
const userRef = (uid) => doc(db, 'users', uid)

/** Fetch the brand knowledge base for a user. Returns null if not set up yet. */
export async function getKnowledgeBase(uid) {
  const snap = await getDoc(userRef(uid))
  if (!snap.exists()) return null
  return snap.data().knowledgeBase ?? null
}

/** Save the brand knowledge base into the user document. */
export async function saveKnowledgeBase(uid, data) {
  try {
    await updateDoc(userRef(uid), {
      knowledgeBase: { ...data, updatedAt: serverTimestamp() },
    })
  } catch (e) {
    // If doc doesn't exist yet, create it
    if (e.code === 'not-found') {
      await setDoc(userRef(uid), {
        knowledgeBase: { ...data, updatedAt: serverTimestamp() },
      }, { merge: true })
    } else {
      throw e
    }
  }
}

/**
 * Record a journey step's output into the knowledge base so later steps
 * (and a future orchestration engine) have context beyond the original
 * brand-setup answers. Keyed by step name, e.g. 'strategy', 'audience'.
 */
export async function appendJourneyOutput(uid, step, summary) {
  const entry = { summary, updatedAt: serverTimestamp() }
  try {
    await updateDoc(userRef(uid), {
      [`knowledgeBase.journeyOutputs.${step}`]: entry,
    })
  } catch (e) {
    if (e.code === 'not-found') {
      await setDoc(userRef(uid), {
        knowledgeBase: { journeyOutputs: { [step]: entry } },
      }, { merge: true })
    } else {
      throw e
    }
  }
}
