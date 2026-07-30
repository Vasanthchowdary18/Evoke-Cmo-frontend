/**
 * governanceService.js
 * Firestore-backed audit trail for the Brand Governance Agent (Fig. 18).
 * Every conformance review decision is appended here so the audit log
 * survives a reload instead of living only in React state.
 */

import {
  collection, addDoc, getDocs, query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const COL = 'governance_audit_log'

// entry: { id, type, status, score, agent }
export async function saveAuditEntry(userId, entry) {
  if (!userId) return null
  const ref = await addDoc(collection(db, COL), {
    userId,
    label:  entry.id     || '',
    type:   entry.type   || '',
    status: entry.status || 'flagged',
    score:  entry.score  ?? 0,
    agent:  entry.agent  || 'Brand Governance Agent',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

// Newest first, sorted client-side to avoid a composite Firestore index.
export async function getAuditLog(userId, max = 20) {
  if (!userId) return []
  const snap = await getDocs(query(collection(db, COL), where('userId', '==', userId)))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, max)
}
