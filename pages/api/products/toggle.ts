import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { checkAuth } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'POST') return res.status(405).end()
  const { id, is_active } = req.body
  const { error } = await supabase.from('miniapp_products').update({ is_active, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ ok: true })
}
