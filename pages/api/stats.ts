import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { checkAuth } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [all, pending, todayOrders] = await Promise.all([
    supabase.from('miniapp_orders').select('amount'),
    supabase.from('miniapp_orders').select('id').eq('status', 'pending'),
    supabase.from('miniapp_orders').select('amount').gte('created_at', today.toISOString())
  ])

  const totalRevenue = (all.data || []).reduce((s, o) => s + (+o.amount || 0), 0)
  const todayRevenue = (todayOrders.data || []).reduce((s, o) => s + (+o.amount || 0), 0)

  res.json({
    totalOrders: all.data?.length || 0,
    pendingOrders: pending.data?.length || 0,
    todayOrders: todayOrders.data?.length || 0,
    totalRevenue: totalRevenue.toFixed(2),
    todayRevenue: todayRevenue.toFixed(2)
  })
}
