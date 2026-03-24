import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers['x-migrate-key'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // 通过 RPC 执行 DDL（需要在 Supabase 创建一个可执行 SQL 的函数）
  // 替代方案：先检查表，再 upsert 建表
  const results = []

  // 检查 miniapp_orders
  const { error: e1 } = await supabase.from('miniapp_orders').select('id').limit(1)
  results.push({ table: 'miniapp_orders', exists: !e1 })

  // 检查 miniapp_products
  const { error: e2 } = await supabase.from('miniapp_products').select('id').limit(1)
  results.push({ table: 'miniapp_products', exists: !e2 })

  const needMigration = results.filter(r => !r.exists)

  if (needMigration.length > 0) {
    return res.json({
      ok: false,
      message: '需要在 Supabase SQL Editor 执行以下 SQL 建表',
      needMigration,
      sql: `
-- 在 Supabase SQL Editor 执行：
CREATE TABLE IF NOT EXISTS miniapp_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT, tg_id TEXT, tg_username TEXT,
  product_id TEXT, product_name TEXT,
  amount DECIMAL(10,2), currency TEXT DEFAULT 'USDT',
  status TEXT DEFAULT 'pending',
  tx_hash TEXT, b2b_order_id TEXT,
  esim_iccid TEXT, esim_qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS miniapp_products (
  id TEXT PRIMARY KEY,
  name TEXT, country TEXT, type TEXT,
  data_size INTEGER, valid_days INTEGER,
  price DECIMAL(10,2), cost_price DECIMAL(10,2),
  profit_rate DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`
    })
  }

  res.json({ ok: true, message: '所有表已就绪', tables: results })
}
