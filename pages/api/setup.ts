import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 建 miniapp_orders 表（通过插入测试记录，如果表不存在会报错，用 RPC 或 migration 建表）
  // 这里简单检查表是否存在
  const { error } = await supabase.from('miniapp_orders').select('id').limit(1)
  if (error?.code === '42P01') {
    return res.json({ ok: false, message: '请在 Supabase 控制台手动创建 miniapp_orders 表', sql: `
CREATE TABLE miniapp_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT, tg_id TEXT, tg_username TEXT,
  product_id TEXT, product_name TEXT,
  amount DECIMAL(10,2), currency TEXT DEFAULT 'USDT',
  status TEXT DEFAULT 'pending', tx_hash TEXT,
  b2b_order_id TEXT, esim_iccid TEXT, esim_qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);` })
  }
  res.json({ ok: true, message: '表已就绪' })
}
