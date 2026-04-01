import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { checkAuth } from '@/lib/auth'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '待付款', color: 'bg-yellow-500/20 text-yellow-400' },
  paid: { label: '已付款', color: 'bg-blue-500/20 text-blue-400' },
  delivered: { label: '已发货', color: 'bg-green-500/20 text-green-400' },
  cancelled: { label: '已取消', color: 'bg-gray-500/20 text-gray-400' },
}

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [txHash, setTxHash] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    const r = await fetch(`/api/orders?status=${filter}`)
    const data = await r.json()
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { loadOrders() }, [filter])

  const confirmPayment = async (orderId: string) => {
    if (!txHash.trim()) return alert('请输入交易哈希')
    setProcessing(orderId)
    const r = await fetch('/api/orders/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, txHash, action: 'confirm_payment' })
    })
    const d = await r.json()
    if (d.ok) { alert('✅ 付款已确认'); setTxHash(''); loadOrders() }
    else alert('❌ ' + d.error)
    setProcessing(null)
  }

  // 一键确认付款并自动发货
  const confirmAndDeliver = async (orderId: string) => {
    if (!txHash.trim()) return alert('请输入交易哈希')
    if (!confirm('确认收款并自动向供应商下单发送eSIM给用户？')) return
    setProcessing(orderId)
    const r = await fetch('/api/orders/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, txHash, action: 'confirm_and_deliver' })
    })
    const d = await r.json()
    if (d.ok) {
      alert(`✅ 发货成功！\nICCID: ${d.esim?.iccid || '待获取'}\n${d.tgNotified ? '已通过 Telegram 通知用户' : '⚠️ 用户无 tg_id，未发送 Telegram 通知'}`)
      setTxHash('')
      loadOrders()
    } else {
      alert('❌ ' + d.error)
    }
    setProcessing(null)
  }

  const sendEsim = async (orderId: string) => {
    if (!confirm('确认向供应商下单并发送eSIM？')) return
    setProcessing(orderId)
    const r = await fetch('/api/orders/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, action: 'send_esim' })
    })
    const d = await r.json()
    if (d.ok) {
      alert(`✅ eSIM已发送\nICCID: ${d.esim?.iccid}\n${d.tgNotified ? '已通过 Telegram 通知用户' : '⚠️ 未发送 Telegram 通知'}`)
      loadOrders()
    } else {
      alert('❌ ' + d.error)
    }
    setProcessing(null)
  }

  return (
    <>
      <Head><title>订单管理 - tgesim管理后台</title></Head>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📡</span>
              <span className="font-bold text-lg">tgesim 管理后台</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/dashboard" className="text-gray-400 hover:text-white">仪表盘</Link>
              <Link href="/visitor-stats" className="text-gray-400 hover:text-white">访客统计</Link>
              <Link href="/orders" className="text-orange-400 font-medium">订单管理</Link>
              <Link href="/products" className="text-gray-400 hover:text-white">产品管理</Link>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">订单管理</h1>
            <button onClick={loadOrders} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">🔄 刷新</button>
          </div>
          <div className="flex gap-2 mb-6">
            {['all','pending','paid','delivered','cancelled'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter===s ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {s === 'all' ? '全部' : STATUS_LABELS[s]?.label || s}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="text-center py-20 text-gray-500">加载中...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 text-gray-500">暂无订单</div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-500">{order.id?.slice(0,8)}...</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[order.status]?.color || 'bg-gray-500/20 text-gray-400'}`}>
                          {STATUS_LABELS[order.status]?.label || order.status}
                        </span>
                      </div>
                      <div className="font-medium">{order.product_name}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        用户TG: {order.tg_id} {order.tg_username ? `(@${order.tg_username})` : ''}
                      </div>
                      {order.tx_hash && <div className="text-xs text-gray-500 mt-1">TX: {order.tx_hash}</div>}
                      {order.esim_iccid && <div className="text-xs text-green-400 mt-1">ICCID: {order.esim_iccid}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-400">${order.amount}</div>
                      <div className="text-xs text-gray-500">{order.currency}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                  {order.status === 'pending' && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                      <input value={txHash} onChange={e => setTxHash(e.target.value)}
                        placeholder="输入交易哈希（TX Hash）"
                        className="flex-1 min-w-48 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      <button onClick={() => confirmPayment(order.id)}
                        disabled={processing === order.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                        ✅ 确认付款
                      </button>
                      <button onClick={() => confirmAndDeliver(order.id)}
                        disabled={processing === order.id}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50 font-semibold">
                        {processing === order.id ? '处理中...' : '🚀 确认并发货'}
                      </button>
                    </div>
                  )}
                  {order.status === 'paid' && !order.esim_iccid && (
                    <div className="mt-4">
                      <button onClick={() => sendEsim(order.id)}
                        disabled={processing === order.id}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                        {processing === order.id ? '发送中...' : '📨 发送 eSIM'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (!checkAuth(ctx.req)) return { redirect: { destination: '/', permanent: false } }
  return { props: {} }
}
