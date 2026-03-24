import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { checkAuth } from '@/lib/auth'
import crypto from 'crypto'
import https from 'https'

const API_KEY = process.env.TGESIM_API_KEY!
const API_SECRET = process.env.TGESIM_API_SECRET!
const BASE_URL = process.env.TGESIM_API_URL!

async function getServerTs(): Promise<string> {
  return new Promise((resolve) => {
    https.get(`${BASE_URL}/api/v1/products?limit=1`, (res) => {
      const date = res.headers['date']
      resolve(String(Math.floor(new Date(date!).getTime())))
      res.resume()
    }).on('error', () => resolve(String(Date.now())))
  })
}

async function apiReq(method: string, endpoint: string, data?: object) {
  const ts = await getServerTs()
  const nonce = crypto.randomBytes(8).toString('hex')
  const body = data ? JSON.stringify(data) : ''
  const sig = crypto.createHmac('sha256', API_SECRET).update(method + endpoint + body + ts + nonce).digest('hex')
  
  return new Promise<any>((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint)
    const options = {
      hostname: url.hostname, path: url.pathname + url.search, method,
      headers: { 'x-api-key': API_KEY, 'x-timestamp': ts, 'x-nonce': nonce, 'x-signature': sig, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }
    const req = https.request(options, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch(e) { reject(e) } })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'POST') return res.status(405).end()

  const { orderId, txHash, action } = req.body

  if (action === 'confirm_payment') {
    // 确认付款
    const { error } = await supabase.from('miniapp_orders').update({
      status: 'paid', tx_hash: txHash, updated_at: new Date().toISOString()
    }).eq('id', orderId)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true, message: '付款已确认' })
  }

  if (action === 'send_esim') {
    // 从供应商API购买并发送eSIM
    const { data: order } = await supabase.from('miniapp_orders').select('*').eq('id', orderId).single()
    if (!order) return res.status(404).json({ error: '订单不存在' })
    
    try {
      // 调用供应商API下单
      const result = await apiReq('POST', '/api/v1/orders', {
        productId: order.product_id,
        quantity: 1
      })
      
      if (result?.message?.order) {
        const supplierOrder = result.message.order
        const esims = supplierOrder.esims || []
        const esim = esims[0]
        
        await supabase.from('miniapp_orders').update({
          status: 'delivered',
          b2b_order_id: supplierOrder.id,
          esim_iccid: esim?.iccid,
          esim_qr_code: esim?.qrCode,
          updated_at: new Date().toISOString()
        }).eq('id', orderId)
        
        return res.json({ ok: true, esim, message: 'eSIM已发送' })
      }
      return res.status(500).json({ error: '供应商API返回异常', result })
    } catch(e: any) {
      return res.status(500).json({ error: e.message })
    }
  }

  res.status(400).json({ error: '未知操作' })
}
