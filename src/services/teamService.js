/**
 * teamService.js
 * Firestore data layer for Team Management.
 *
 * Schema — users/{uid}/teamMembers/{memberId}:
 *   name       string
 *   email      string
 *   role       'owner' | 'admin' | 'editor' | 'viewer'
 *   status     'active' | 'inactive'
 *   joinedAt   timestamp
 *
 * Schema — users/{uid}/teamInvites/{inviteId}:
 *   email      string
 *   role       'admin' | 'editor' | 'viewer'
 *   sentAt     timestamp
 */

import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc,
  getDocs, orderBy, query, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { sendEmail } from './emailService'

function membersRef(uid) {
  return collection(db, 'users', uid, 'teamMembers')
}
function invitesRef(uid) {
  return collection(db, 'users', uid, 'teamInvites')
}

/** Fetch all team members, oldest (owner) first. */
export async function getMembers(uid) {
  const q = query(membersRef(uid), orderBy('joinedAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/** Ensures the signed-in account has an 'owner' member record. No-op if one already exists. */
export async function ensureOwnerMember(uid, profile) {
  const existing = await getMembers(uid)
  if (existing.some(m => m.role === 'owner')) return existing
  await setDoc(doc(membersRef(uid), 'owner'), {
    name: profile?.name || profile?.email?.split('@')[0] || 'You',
    email: profile?.email || '',
    role: 'owner',
    status: 'active',
    joinedAt: serverTimestamp(),
  })
  return getMembers(uid)
}

/** Adds a member directly (used when accepting an invite in future; not exposed in UI yet). */
export async function addMember(uid, data) {
  const ref = await addDoc(membersRef(uid), {
    name: data.name || data.email.split('@')[0],
    email: data.email,
    role: data.role || 'viewer',
    status: 'active',
    joinedAt: serverTimestamp(),
  })
  return { id: ref.id }
}

export async function updateMemberRole(uid, memberId, role) {
  await updateDoc(doc(membersRef(uid), memberId), { role })
}

export async function removeMember(uid, memberId) {
  await deleteDoc(doc(membersRef(uid), memberId))
}

/** Fetch pending invites, most recent first. */
export async function getInvites(uid) {
  const q = query(invitesRef(uid), orderBy('sentAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/** Creates an invite record and best-effort emails the invitee. Email failure never blocks the invite. */
export async function createInvite(uid, email, role, inviterName) {
  const ref = await addDoc(invitesRef(uid), { email, role, sentAt: serverTimestamp() })
  try {
    await sendEmail({
      to: email,
      subject: `${inviterName || 'A teammate'} invited you to Evox CMO`,
      html: `<p>Hi,</p><p>${inviterName || 'A teammate'} invited you to join their workspace on Evox CMO as a <strong>${role}</strong>.</p>`,
    })
  } catch (e) {
    console.error('Invite email failed to send', e)
  }
  return { id: ref.id }
}

export async function resendInvite(uid, inviteId, email, role, inviterName) {
  await updateDoc(doc(invitesRef(uid), inviteId), { sentAt: serverTimestamp() })
  try {
    await sendEmail({
      to: email,
      subject: `Reminder: ${inviterName || 'A teammate'} invited you to Evox CMO`,
      html: `<p>Hi,</p><p>Just a reminder — ${inviterName || 'a teammate'} invited you to join their workspace on Evox CMO as a <strong>${role}</strong>.</p>`,
    })
  } catch (e) {
    console.error('Invite resend email failed to send', e)
  }
}

export async function cancelInvite(uid, inviteId) {
  await deleteDoc(doc(invitesRef(uid), inviteId))
}
