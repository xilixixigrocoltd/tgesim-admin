import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'from-blue-600/20 to-blue-800/20 border-blue-500/30',
    green: 'from-green-600/20 to-green-800/20 border-green-500/30',
    purple: 'from-purple-600/20 to-purple-800/20 border-purple-500/30',
    orange: 'from-orange-600/20 to-orange-800/20 border-orange-500/30',
    cyan: 'from-cyan-600/20 to-cyan-800/20 border-cyan-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-slate-400 text-xs mt-1">{sub}</div>}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default function VisitorStatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVisitorStats();
  }, []);

  const fetchVisitorStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/visitor-stats');
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching visitor stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-6">
          <div className="text-red-400 text-center">加载数据失败: {error}</div>
          <button 
            onClick={fetchVisitorStats}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Head>
        <title>访客统计 - TGeSIM Admin</title>
      </Head>

      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">访客统计</h1>
          <p className="text-slate-400 text-sm mt-1">C端用户访问数据概览</p>
        </div>

        {stats && (
          <>
            <div className="mb-6">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">今日数据</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  icon="👥"
                  label="今日访客"
                  value={stats.today.visitors}
                  sub="访问用户数量"
                  color="cyan"
                />
                <StatCard
                  icon="📦"
                  label="今日订单"
                  value={stats.today.orders}
                  sub="产生订单数量"
                  color="blue"
                />
                <StatCard
                  icon="💰"
                  label="今日收入"
                  value={`$${stats.today.revenue.toFixed(2)}`}
                  sub="订单总收入"
                  color="green"
                />
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">本月数据</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  icon="👥"
                  label="本月访客"
                  value={stats.month.visitors}
                  sub="月度访问用户"
                  color="cyan"
                />
                <StatCard
                  icon="📦"
                  label="本月订单"
                  value={stats.month.orders}
                  sub="月度订单数量"
                  color="blue"
                />
                <StatCard
                  icon="💰"
                  label="本月收入"
                  value={`$${stats.month.revenue.toFixed(2)}`}
                  sub="月度总收入"
                  color="green"
                />
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">累计数据</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  icon="👥"
                  label="总访客数"
                  value={stats.total.visitors}
                  sub="注册用户总数"
                  color="purple"
                />
                <StatCard
                  icon="📦"
                  label="总订单数"
                  value={stats.total.orders}
                  sub="历史订单总数"
                  color="purple"
                />
                <StatCard
                  icon="💎"
                  label="总收入"
                  value={`$${stats.total.revenue.toFixed(2)}`}
                  sub="历史总收入"
                  color="purple"
                />
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">活跃用户</h2>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <div className="text-3xl font-bold text-white mb-2">{stats.activeUsers}</div>
                <div className="text-slate-400 text-sm">总注册用户数</div>
              </div>
            </div>

            {stats.recentOrders && stats.recentOrders.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">近期订单</h2>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="text-left p-3 text-slate-300">订单ID</th>
                        <th className="text-left p-3 text-slate-300">用户</th>
                        <th className="text-left p-3 text-slate-300">产品</th>
                        <th className="text-left p-3 text-slate-300">金额</th>
                        <th className="text-left p-3 text-slate-300">状态</th>
                        <th className="text-left p-3 text-slate-300">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((order, index) => (
                        <tr key={index} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                          <td className="p-3 text-slate-300">{order.id}</td>
                          <td className="p-3 text-slate-300">{order.userId}</td>
                          <td className="p-3 text-slate-300">{order.productName}</td>
                          <td className="p-3 text-slate-300">${order.amount}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.status === 'activated' || order.status === 'paid' 
                                ? 'bg-green-900/50 text-green-400' 
                                : 'bg-yellow-900/50 text-yellow-400'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 text-xs">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {!stats && (
          <div className="text-center py-12 text-slate-500">
            暂无访客统计数据
          </div>
        )}
      </div>
    </div>
  );
}