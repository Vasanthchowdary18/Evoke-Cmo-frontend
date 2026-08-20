/**
 * api/brand-kb.js
 * Node runtime (not edge — needs firebase-admin). Backs getKnowledgeBase /
 * saveKnowledgeBase in src/services/knowledgeBaseService.js. Reads/writes the
 * brand_knowledge_base Supabase table, scoped to the verified uid.
 */
import { verifyRequestUser } from './_lib/verifyUser.js'
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const uid = await verifyRequestUser(req)
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })

  const supabase = getSupabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('brand_knowledge_base')
      .select('data')
      .eq('user_id', uid)
      .maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data: data?.data ?? null })
  }

  if (req.method === 'POST') {
    const { data } = req.body || {}
    if (!data) return res.status(400).json({ error: 'data is required' })
    const { error } = await supabase
      .from('brand_knowledge_base')
      .upsert({ user_id: uid, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
