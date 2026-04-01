import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { checkAuth } from '@/lib/auth'

interface Stats {
  totalOrders: number
  pendingOrders: number
  todayOrders: number
  totalRevenue: string
  todayRevenue: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [visitorStats, setVisitorStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats)
    fetch('/api/visitor-stats').then(r => r.json()).then(setVisitorStats)
  }, [])

  const businessCards = [
    { label: '待处理订单', value: stats?.pendingOrders ?? '-', color: 'text-red-400', bg: 'bg-red-500/10', icon: '⏳' },
    { label: '今日订单', value: stats?.todayOrders ?? '-', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: '📦' },
    { label: '今日收入', value: stats ? `$${stats.todayRevenue}` : '-', color: 'text-green-400', bg: 'bg-green-500/10', icon: '💰' },
    { label: '总收入', value: stats ? `$${stats.totalRevenue}` : '-', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: '📊' },
  ]

  const visitorCards = visitorStats ? [
    { label: '今日访客', value: visitorStats.today?.visitors || 0, color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: '👥' },
    { label: '本月访客', value: visitorStats.month?.visitors || 0, color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: '📅' },
    { label: '总访客数', value: visitorStats.total?.visitors || 0, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: '📊' },
    { label: '活跃用户', value: visitorStats.activeUsers || 0, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: '⭐' },
  ] : []

  return (
    <>
      <Head><title>仪表盘 - tgesim管理后台</title></Head>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📡</span>
              <span className="font-bold text-lg">tgesim 管理后台</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/dashboard" className="text-orange-400 font-medium">仪表盘</Link>
              <Link href="/visitor-stats" className="text-gray-400 hover:text-white">访客统计</Link>
              <Link href="/orders" className="text-gray-400 hover:text-white">订单管理</Link>
              <Link href="/products" className="text-gray-400 hover:text-white">产品管理</Link>
            </div>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
          {/* 访客统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {visitorCards.map((c, i) => (
              <div key={`visitor-${i}`} className={`${c.bg} border border-gray-700 rounded-xl p-5`}>
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                <div className="text-gray-400 text-sm mt-1">{c.label}</div>
              </div>
            ))}
          </div>
          
          {/* 业务统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {businessCards.map((c, i) => (
              <div key={`business-${i}`} className={`${c.bg} border border-gray-700 rounded-xl p-5`}>
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                <div className="text-gray-400 text-sm mt-1">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/orders?status=pending" className="bg-gray-800 border border-red-500/30 rounded-xl p-6 hover:bg-gray-750 transition">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">⚡</span>
                <span className="font-semibold text-lg">待处理订单</span>
                {stats?.pendingOrders ? <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingOrders}</span> : null}
              </div>
              <p className="text-gray-400 text-sm">查看并确认待付款订单，手动发送eSIM</p>
            </Link>
            <Link href="/orders" className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 transition">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📋</span>
                <span className="font-semibold text-lg">所有订单</span>
              </div>
              <p className="text-gray-400 text-sm">查看全部订单历史和状态</p>
            </Link>
            <Link href="/products" className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 transition">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🗂️</span>
                <span className="font-semibold text-lg">产品管理</span>
              </div>
              <p className="text-gray-400 text-sm">上架/下架产品，管理1984个产品</p>
            </Link>
            <a href="https://mini-app-khaki-omega.vercel.app/" target="_blank" className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:bg-gray-750 transition">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📱</span>
                <span className="font-semibold text-lg">前台 Miniapp</span>
              </div>
              <p className="text-gray-400 text-sm">打开 tgesim miniapp 用户界面</p>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (!checkAuth(ctx.req)) return { redirect: { destination: '/', permanent: false } }
  return { props: {} }
}
