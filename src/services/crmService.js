/**
 * crmService.js
 * Stores contacts as a field inside users/{uid} to avoid subcollection
 * permission issues — same pattern as knowledgeBaseService.js.
 *
 * users/{uid}.crmContacts: Array of contact objects
 */

import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const userRef = (uid) => doc(db, 'users', uid)

function genId() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

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
    if (days <= 7)       score += 15
    else if (days <= 30) score += 8
  }

  return Math.min(score, 100)
}

async function readContacts(uid) {
  const snap = await getDoc(userRef(uid))
  if (!snap.exists()) return []
  return snap.data().crmContacts || []
}

async function writeContacts(uid, contacts) {
  try {
    await updateDoc(userRef(uid), { crmContacts: contacts })
  } catch (e) {
    if (e.code === 'not-found') {
      await setDoc(userRef(uid), { crmContacts: contacts }, { merge: true })
    } else {
      throw e
    }
  }
}

export async function getContacts(uid) {
  const contacts = await readContacts(uid)
  return [...contacts].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function addContact(uid, data) {
  const contacts = await readContacts(uid)
  const newContact = {
    id:          genId(),
    name:        data.name?.trim()    || '',
    email:       data.email?.trim()   || '',
    company:     data.company?.trim() || '',
    phone:       data.phone?.trim()   || '',
    stage:       data.stage           || 'lead',
    notes:       data.notes?.trim()   || '',
    tags:        data.tags            || [],
    source:      data.source          || 'manual',
    lastContact: data.lastContact     || null,
    createdAt:   Date.now(),
  }
  newContact.score = calcScore(newContact)
  await writeContacts(uid, [newContact, ...contacts])
  return newContact
}

export async function updateContact(uid, contactId, data) {
  const contacts = await readContacts(uid)
  const updated = {
    name:        data.name?.trim()    || '',
    email:       data.email?.trim()   || '',
    company:     data.company?.trim() || '',
    phone:       data.phone?.trim()   || '',
    stage:       data.stage           || 'lead',
    notes:       data.notes?.trim()   || '',
    tags:        data.tags            || [],
    lastContact: data.lastContact     || null,
  }
  updated.score = calcScore(updated)
  const next = contacts.map(c => c.id === contactId ? { ...c, ...updated } : c)
  await writeContacts(uid, next)
  return { id: contactId, ...updated }
}

export async function deleteContact(uid, contactId) {
  const contacts = await readContacts(uid)
  await writeContacts(uid, contacts.filter(c => c.id !== contactId))
}
