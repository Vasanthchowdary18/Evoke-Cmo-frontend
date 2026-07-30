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
import { sendEmail } from './emailService'

/* ── Stage lifecycle automation ────────────────────────────────────────────
   Moving a contact forward a stage (lead → prospect → customer → retained)
   sends them a templated email automatically, if they have an email on file.
   Failures are logged, never thrown — automation should never block a save.
*/
const STAGE_ORDER = ['lead', 'prospect', 'customer', 'retained']

const STAGE_EMAIL = {
  prospect: {
    subject: (name) => `Great connecting, ${name || 'there'}!`,
    html: (name) => `<p>Hi ${name || 'there'},</p><p>Thanks for your interest — we've moved you into our active pipeline and someone from our team will be in touch shortly with next steps.</p>`,
  },
  customer: {
    subject: () => `Welcome aboard! 🎉`,
    html: (name) => `<p>Hi ${name || 'there'},</p><p>Welcome as a customer! We're excited to work with you. Here's what happens next — our team will reach out with onboarding details shortly.</p>`,
  },
  retained: {
    subject: () => `Thank you for being a loyal customer`,
    html: (name) => `<p>Hi ${name || 'there'},</p><p>We wanted to say thank you for continuing to work with us. Watch your inbox for an exclusive offer as a token of our appreciation.</p>`,
  },
}

async function maybeSendStageEmail(contact, previousStage) {
  if (!previousStage || previousStage === contact.stage) return
  if (!contact.email) return
  const prevIdx = STAGE_ORDER.indexOf(previousStage)
  const newIdx  = STAGE_ORDER.indexOf(contact.stage)
  if (newIdx <= prevIdx) return // only forward transitions trigger automation
  const template = STAGE_EMAIL[contact.stage]
  if (!template) return
  try {
    await sendEmail({ to: contact.email, subject: template.subject(contact.name), html: template.html(contact.name) })
  } catch (e) {
    console.error('Stage automation email failed', e)
  }
}

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

/** Update an existing contact. Score recalculated on every save.
 *  Pass `previousStage` (the contact's stage before this edit) to trigger
 *  stage-lifecycle email automation on forward stage moves. */
export async function updateContact(uid, contactId, data, previousStage) {
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
  maybeSendStageEmail(payload, previousStage)
  return { id: contactId, ...payload }
}

/** Delete a contact permanently. */
export async function deleteContact(uid, contactId) {
  await deleteDoc(doc(db, 'users', uid, 'contacts', contactId))
}
