/**
 * crmService.js
 * Firestore data layer for the CRM module.
 *
 * Schema — users/{uid}/contacts/{contactId}:
 *   name         string
 *   email        string
 *   company      string
 *   phone        string
 *   stage        'lead' | 'prospect' | 'customer' | 'retained'
 *   score        number  0-100  (auto-calculated)
 *   notes        string
 *   tags         string[]
 *   source       'manual' | 'campaign' | 'import'
 *   lastContact  timestamp | null
 *   createdAt    timestamp
 */

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, orderBy, query, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'

/* ── Lead score algorithm ──────────────────────────────────────────────────
   Each contact is auto-scored 0-100 based on data completeness + stage.
   Higher score = warmer / more valuable lead.
*/
export function calcScore(contact) {
  let score = 0
  if (contact.email)   score += 20
  if (contact.company) score += 15
  if (contact.phone)   score += 10
  if (contact.notes)   score += 10

  const stageBonus = { lead: 0, prospect: 20, customer: 35, retained: 50 }
  score += stageBonus[contact.stage] || 0

  if (contact.lastContact) {
    const days = (Date.now() - new Date(contact.lastContact).getTime()) / 86400000
    if (days <= 7)  score += 15
    else if (days <= 30) score += 8
  }

  return Math.min(score, 100)
}

function contactsRef(uid) {
  return collection(db, 'users', uid, 'contacts')
}

/** Fetch all contacts for a user, sorted newest first. */
export async function getContacts(uid) {
  const q = query(contactsRef(uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/** Add a new contact. Score is auto-calculated before saving. */
export async function addContact(uid, data) {
  const payload = {
    name:        data.name?.trim()    || '',
    email:       data.email?.trim()   || '',
    company:     data.company?.trim() || '',
    phone:       data.phone?.trim()   || '',
    stage:       data.stage           || 'lead',
    notes:       data.notes?.trim()   || '',
    tags:        data.tags            || [],
    source:      data.source          || 'manual',
    lastContact: data.lastContact     || null,
    createdAt:   serverTimestamp(),
  }
  payload.score = calcScore(payload)
  const ref = await addDoc(contactsRef(uid), payload)
  return { id: ref.id, ...payload }
}

/** Update an existing contact. Score recalculated on every save. */
export async function updateContact(uid, contactId, data) {
  const payload = {
    name:        data.name?.trim()    || '',
    email:       data.email?.trim()   || '',
    company:     data.company?.trim() || '',
    phone:       data.phone?.trim()   || '',
    stage:       data.stage           || 'lead',
    notes:       data.notes?.trim()   || '',
    tags:        data.tags            || [],
    lastContact: data.lastContact     || null,
  }
  payload.score = calcScore(payload)
  await updateDoc(doc(db, 'users', uid, 'contacts', contactId), payload)
  return { id: contactId, ...payload }
}

/** Delete a contact permanently. */
export async function deleteContact(uid, contactId) {
  await deleteDoc(doc(db, 'users', uid, 'contacts', contactId))
}
