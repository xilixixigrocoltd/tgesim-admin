import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'
import { checkAuth } from '@/lib/auth'

export default function Login() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    if (res.ok) {
      window.location.href = '/dashboard'
    } else {
      setError('密码错误')
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>tgesim 管理后台</title></Head>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📡</div>
            <h1 className="text-2xl font-bold text-white">tgesim 管理后台</h1>
            <p className="text-gray-400 text-sm mt-1">miniapp 订单与产品管理</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">管理员密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (checkAuth(ctx.req)) return { redirect: { destination: '/dashboard', permanent: false } }
  return { props: {} }
}
