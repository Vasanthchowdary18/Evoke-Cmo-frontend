import {
  collection, doc, getDocs, query, where,
  updateDoc, serverTimestamp, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

// ─── content_items document structure ──────────────────────────────────────
// content_items/{id}:
//   userId: string
//   campaignId: string            // groups items generated in one run
//   campaignName: string
//   campaignType: string          // event | product | growth_strategy | post-content | ...
//   type: 'post' | 'email' | 'ad' | 'seo' | 'strategy'
//   platform: 'linkedin' | 'instagram' | 'facebook' | 'tiktok' | 'whatsapp' | 'email' | 'gmail' | 'twitter' | ''
//   text: string                  // caption / body
//   subject: string               // email subject (email items only)
//   data: string                  // JSON payload for structured items (strategy docs)
//   imageUrl, videoUrl: string
//   status: 'draft' | 'approved' | 'scheduled' | 'published' | 'rejected'
//   scheduledAt: timestamp | null
//   publishedAt: timestamp | null
//   source: 'campaign' | 'post-content'
//   createdAt, updatedAt: timestamp

const COL = 'content_items'

// Save a batch of generated items in one Firestore write.
// items: [{ key, type, platform, text, subject?, data?, imageUrl?, videoUrl? }]
// Returns { [key]: docId } so callers can update these docs later (edit / publish).
export async function saveContentItems(userId, campaignMeta, items, status = 'draft') {
  if (!userId || !items?.length) return {}
  const batch = writeBatch(db)
  const ids = {}
  items.forEach(item => {
    const ref = doc(collection(db, COL))
    ids[item.key] = ref.id
    batch.set(ref, {
      userId,
      campaignId:   campaignMeta.campaignId   || '',
      campaignName: campaignMeta.name         || '',
      campaignType: campaignMeta.type         || '',
      type:         item.type                 || 'post',
      platform:     item.platform             || '',
      text:         item.text                 || '',
      subject:      item.subject              || '',
      data:         item.data                 || '',
      imageUrl:     item.imageUrl             || '',
      videoUrl:     item.videoUrl             || '',
      status,
      scheduledAt:  null,
      publishedAt:  status === 'published' ? serverTimestamp() : null,
      source:       campaignMeta.source       || 'campaign',
      createdAt:    serverTimestamp(),
      updatedAt:    serverTimestamp(),
    })
  })
  await batch.commit()
  return ids
}

export async function updateContentItem(id, data) {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
}

// Mark a set of items published. finalTexts ({ [key]: text }) lets the caller
// persist user edits made between generation and launch.
export async function markItemsPublished(ids, finalTexts = {}) {
  const entries = Object.entries(ids || {})
  if (!entries.length) return
  const batch = writeBatch(db)
  entries.forEach(([key, id]) => {
    const update = { status: 'published', publishedAt: serverTimestamp(), updatedAt: serverTimestamp() }
    if (finalTexts[key]) update.text = finalTexts[key]
    batch.update(doc(db, COL, id), update)
  })
  await batch.commit()
}

export async function setItemStatus(id, status, extra = {}) {
  await updateDoc(doc(db, COL, id), {
    status,
    ...(status === 'published' ? { publishedAt: serverTimestamp() } : {}),
    ...extra,
    updatedAt: serverTimestamp(),
  })
}

// Schedule an approved item — sets status to 'scheduled' and stores the JS Date as an ISO string
// (Firestore Timestamp is set server-side by the n8n cron after posting)
export async function scheduleItem(id, scheduledAt) {
  await updateDoc(doc(db, COL, id), {
    status: 'scheduled',
    scheduledAt: scheduledAt instanceof Date ? scheduledAt.toISOString() : scheduledAt,
    updatedAt: serverTimestamp(),
  })
}

// Fetch a user's content library, newest first (sorted client-side to avoid
// needing a composite Firestore index).
export async function getContentItems(userId, status = null) {
  if (!userId) return []
  const clauses = [where('userId', '==', userId)]
  if (status) clauses.push(where('status', '==', status))
  const snap = await getDocs(query(collection(db, COL), ...clauses))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
}
