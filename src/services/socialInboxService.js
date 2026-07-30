/**
 * socialInboxService.js
 * Firestore persistence for Social Inbox reply threads.
 *
 * There is no live social-platform message source wired into this app yet
 * (no Meta Conversations API / GHL integration) — SocialInbox.jsx still shows
 * example conversations as the base data. This service only persists the
 * reply history on top of those example threads, so a user's own replies
 * survive a reload instead of resetting every time.
 *
 * Schema — users/{uid}/inboxThreads/{threadId}:
 *   thread     array of { from: 'me'|'them', text, time }
 *   updatedAt  timestamp
 */

import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

function threadsRef(uid) {
  return collection(db, 'users', uid, 'inboxThreads')
}

/** Persists the full message thread for one conversation. */
export async function saveThreadReply(uid, threadId, thread) {
  if (!uid) return
  await setDoc(doc(threadsRef(uid), threadId), { thread, updatedAt: serverTimestamp() }, { merge: true })
}

/** Returns a map of threadId -> saved thread array. */
export async function getSavedThreads(uid) {
  if (!uid) return {}
  const snap = await getDocs(threadsRef(uid))
  const out = {}
  snap.docs.forEach(d => { out[d.id] = d.data().thread })
  return out
}
