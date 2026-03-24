import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { checkAuth } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { status, page = '1' } = req.query
    let query = supabase.from('miniapp_orders').select('*').order('created_at', { ascending: false }).range((+page-1)*20, +page*20-1)
    if (status && status !== 'all') query = query.eq('status', status)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  res.status(405).end()
}
