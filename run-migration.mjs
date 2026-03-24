import { createClient } from '@supabase/supabase-js'
import https from 'https'

const SUPABASE_URL = 'https://afdyzuohzwdvreyhnfdb.supabase.co'
const SERVICE_KEY = 'process.env.SUPABASE_SERVICE_KEY'

// 直接用 HTTP 调用 Supabase REST API 的 SQL 端点
// Supabase 有一个内部端点可以执行 SQL

function execSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql })
    const options = {
      hostname: 'afdyzuohzwdvreyhnfdb.supabase.co',
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }
    const req = https.request(options, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => resolve({ status: res.statusCode, body: d }))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// 试几个不同的路径
const paths = ['/rest/v1/rpc/exec', '/rest/v1/rpc/execute', '/pg/query']
for (const path of paths) {
  const r = await new Promise((resolve) => {
    const body = JSON.stringify({ query: 'SELECT 1' })
    const req = https.request({
      hostname: 'afdyzuohzwdvreyhnfdb.supabase.co',
      path, method: 'POST',
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve({s:res.statusCode,b:d.slice(0,100)})) })
    req.on('error', e=>resolve({s:0,b:e.message}))
    req.write(body); req.end()
  })
  console.log(`${path}: ${r.s} ${r.b}`)
}
