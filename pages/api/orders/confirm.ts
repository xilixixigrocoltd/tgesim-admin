import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { checkAuth } from '@/lib/auth'
import crypto from 'crypto'
import https from 'https'

const API_KEY = process.env.TGESIM_API_KEY!
const API_SECRET = process.env.TGESIM_API_SECRET!
const BASE_URL = process.env.TGESIM_API_URL!
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN || '8408392839:AAF6Xqoqrm4c87DvQe1fJ4izBgyAE5m3YnY'

// Get server timestamp from API response headers (required by supplier)
async function getServerTs(): Promise<string> {
  return new Promise((resolve) => {
    https.get(`${BASE_URL}/api/v1/products?limit=1`, (res) => {
      const date = res.headers['date']
      resolve(String(Math.floor(new Date(date!).getTime())))
      res.resume()
    }).on('error', () => resolve(String(Date.now())))
  })
}

// Call supplier API with HMAC-SHA256 signing
async function apiReq(method: string, endpoint: string, data?: object) {
  const ts = await getServerTs()
  const nonce = crypto.randomBytes(8).toString('hex')
  const body = data ? JSON.stringify(data) : ''
  const sig = crypto
    .createHmac('sha256', API_SECRET)
    .update(method + endpoint + body + ts + nonce)
    .digest('hex')

  return new Promise<any>((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint)
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'x-api-key': API_KEY,
        'x-timestamp': ts,
        'x-nonce': nonce,
        'x-signature': sig,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }
    const req = https.request(options, (res) => {
      let d = ''
      res.on('data', (c) => (d += c))
      res.on('end', () => {
        try {
          resolve(JSON.parse(d))
        } catch (e) {
          reject(new Error(`Invalid JSON: ${d.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

// Send message via Telegram Bot API
async function sendTelegramMessage(tgId: string, text: string): Promise<void> {
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: tgId, text, parse_mode: 'HTML' })
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TG_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }
    const req = https.request(options, (res) => {
      let d = ''
      res.on('data', (c) => (d += c))
      res.on('end', () => {
        try {
          const result = JSON.parse(d)
          if (!result.ok) {
            console.error('[TG] sendMessage failed:', result.description)
          }
        } catch {}
        resolve()
      })
    })
    req.on('error', (e) => {
      console.error('[TG] Request error:', e.message)
      resolve()
    })
    req.write(body)
    req.end()
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'POST') return res.status(405).end()

  const { orderId, txHash, action } = req.body

  // ── 确认付款 ── (just mark as paid, no auto delivery)
  if (action === 'confirm_payment') {
    const { error } = await supabase
      .from('miniapp_orders')
      .update({ status: 'paid', tx_hash: txHash, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true, message: '付款已确认' })
  }

  // ── 确认付款 + 自动发货（一键完成）──
  if (action === 'confirm_and_deliver') {
    // 1. Update order to paid
    const { error: payErr } = await supabase
      .from('miniapp_orders')
      .update({ status: 'paid', tx_hash: txHash, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (payErr) return res.status(500).json({ error: payErr.message })

    // Fall through to deliver
  }

  // ── 发送 eSIM（手动触发 or 自动接续 confirm_and_deliver）──
  if (action === 'send_esim' || action === 'confirm_and_deliver') {
    // Fetch order details
    const { data: order, error: fetchErr } = await supabase
      .from('miniapp_orders')
      .select('*')
      .eq('id', orderId)
      .single()
    if (fetchErr || !order) return res.status(404).json({ error: '订单不存在' })

    try {
      // 2. Call supplier API to create order
      const result = await apiReq('POST', '/api/v1/orders', {
        productId: order.product_id,
        quantity: 1,
      })

      if (!result?.message?.order) {
        console.error('[supplier] Unexpected response:', JSON.stringify(result))
        return res.status(500).json({ error: '供应商API返回异常', result })
      }

      const supplierOrder = result.message.order
      const esims: any[] = supplierOrder.esims || []
      const esim = esims[0] || {}
      const iccid = esim.iccid || supplierOrder.iccid || ''
      const qrCode = esim.qrCode || esim.ac || supplierOrder.qrCode || ''

      // 3. Save eSIM info and mark as delivered
      await supabase.from('miniapp_orders').update({
        status: 'delivered',
        b2b_order_id: String(supplierOrder.id || ''),
        esim_iccid: iccid,
        esim_qr_code: qrCode,
        updated_at: new Date().toISOString(),
      }).eq('id', orderId)

      // 4. Send eSIM to user via Telegram Bot
      if (order.tg_id) {
        const msg =
          `✅ 您的 eSIM 已激活！\n\n` +
          `📦 产品：${order.product_name}\n` +
          `📱 ICCID：${iccid || '获取中'}\n` +
          `🔑 激活码：${qrCode || '获取中'}\n\n` +
          `请在手机设置中扫描二维码安装。\n` +
          `如有问题联系 @Esim_kefu_bot`
        await sendTelegramMessage(order.tg_id, msg)
      }

      return res.json({
        ok: true,
        message: 'eSIM已发货并通知用户',
        esim: { iccid, qrCode },
        tgNotified: !!order.tg_id,
      })
    } catch (e: any) {
      console.error('[deliver] Error:', e)
      return res.status(500).json({ error: e.message })
    }
  }

  res.status(400).json({ error: '未知操作' })
}
