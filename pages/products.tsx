import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import { checkAuth } from '@/lib/auth'

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => {
      setProducts(d || [])
      setLoading(false)
    })
  }, [])

  const toggle = async (id: string, current: boolean) => {
    await fetch('/api/products/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current })
    })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.country?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'active' && p.is_active) || (filter === 'inactive' && !p.is_active)
    return matchSearch && matchFilter
  })

  return (
    <>
      <Head><title>产品管理 - tgesim管理后台</title></Head>
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
              <Link href="/orders" className="text-gray-400 hover:text-white">订单管理</Link>
              <Link href="/products" className="text-orange-400 font-medium">产品管理</Link>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">产品管理</h1>
            <div className="text-sm text-gray-400">共 {products.length} 个产品 | 上架 {products.filter(p=>p.is_active).length} 个</div>
          </div>
          <div className="flex gap-3 mb-6">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索国家或产品名..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            {['all','active','inactive'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm ${filter===f ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {f === 'all' ? '全部' : f === 'active' ? '已上架' : '已下架'}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="text-center py-20 text-gray-500">加载中...</div>
          ) : (
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-750 border-b border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-400">产品名称</th>
                    <th className="text-left px-4 py-3 text-gray-400">国家</th>
                    <th className="text-left px-4 py-3 text-gray-400">类型</th>
                    <th className="text-right px-4 py-3 text-gray-400">价格</th>
                    <th className="text-right px-4 py-3 text-gray-400">利润率</th>
                    <th className="text-center px-4 py-3 text-gray-400">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.slice(0, 100).map(p => (
                    <tr key={p.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-gray-400">{p.country}</td>
                      <td className="px-4 py-3"><span className="bg-gray-700 px-2 py-0.5 rounded text-xs">{p.type}</span></td>
                      <td className="px-4 py-3 text-right text-green-400">${p.price}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`${+p.profit_rate >= 50 ? 'text-green-400' : +p.profit_rate >= 30 ? 'text-blue-400' : 'text-yellow-400'}`}>
                          {p.profit_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggle(p.id, p.is_active)}
                          className={`relative inline-flex h-5 w-9 rounded-full transition ${p.is_active ? 'bg-orange-500' : 'bg-gray-600'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition mt-0.5 ${p.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 100 && <div className="text-center py-4 text-gray-500 text-sm">显示前100条，请使用搜索筛选</div>}
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
