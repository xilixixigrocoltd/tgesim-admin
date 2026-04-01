import { checkAuth } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

// 读取Telegram Bot的数据文件获取访客统计
async function getVisitorStatsFromBotData() {
  try {
    // 读取Bot数据文件 - 使用绝对路径
    const botDataPath = '/home/adobe/.openclaw/workspace/esim-bot-data.json';
    const dataStr = await fs.readFile(botDataPath, 'utf8');
    const data = JSON.parse(dataStr);
    
    const orders = data.orders || [];
    const users = data.users || {};
    
    // 获取当前日期统计
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7); // YYYY-MM
    
    // 按日期和用户统计访客
    const todayUserSet = new Set();
    const monthUserSet = new Set();
    
    for (const order of orders) {
      if (order.createdAt) {
        if (order.createdAt.startsWith(today)) {
          todayUserSet.add(order.userId);
        }
        if (order.createdAt.startsWith(currentMonth)) {
          monthUserSet.add(order.userId);
        }
      }
    }
    
    // 今日统计
    const todayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(today));
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    
    // 本月统计
    const monthOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(currentMonth));
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    
    // 总收入
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    
    return {
      today: {
        visitors: todayUserSet.size,  // 去重后的用户数
        revenue: todayRevenue,
        orders: todayOrders.length
      },
      month: {
        visitors: monthUserSet.size,  // 去重后的用户数
        revenue: monthRevenue,
        orders: monthOrders.length
      },
      total: {
        visitors: Object.keys(users).length,  // 总注册用户数
        revenue: totalRevenue,
        orders: orders.length
      },
      activeUsers: Object.keys(users).length,
      recentOrders: orders.slice(0, 10).map(o => ({
        id: o.id,
        userId: o.userId,
        productName: o.productName,
        amount: o.amount,
        status: o.status,
        createdAt: o.createdAt
      }))
    };
  } catch (error) {
    console.error('Error fetching visitor stats from bot data:', error);
    // 如果读取不到Bot数据，返回基本统计
    return {
      today: { visitors: 0, revenue: 0, orders: 0 },
      month: { visitors: 0, revenue: 0, orders: 0 },
      total: { visitors: 0, revenue: 0, orders: 0 },
      activeUsers: 0,
      recentOrders: []
    };
  }
}

export default async function handler(req, res) {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // 获取Bot数据中的访客统计
    const botStats = await getVisitorStatsFromBotData();

    res.json(botStats);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      today: { visitors: 0, revenue: 0, orders: 0 },
      month: { visitors: 0, revenue: 0, orders: 0 },
      total: { visitors: 0, revenue: 0, orders: 0 },
      activeUsers: 0,
      recentOrders: []
    });
  }
}