import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://afdyzuohzwdvreyhnfdb.supabase.co',
  'process.env.SUPABASE_SERVICE_KEY'
)

// 检查表是否存在
const { error: e1 } = await supabase.from('miniapp_orders').select('id').limit(1)
console.log('miniapp_orders:', e1 ? e1.message : '✅ 表存在')

const { error: e2 } = await supabase.from('miniapp_products').select('id').limit(1)
console.log('miniapp_products:', e2 ? e2.message : '✅ 表存在')
