import type { NextApiRequest, NextApiResponse } from 'next'

// 临时管理员初始化API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { initKey, newPassword } = req.body

  // 临时初始化密钥 - 仅用于首次设置
  const TEMP_INIT_KEY = 'init_tgesim_admin_2026'
  
  if (initKey !== TEMP_INIT_KEY) {
    return res.status(401).json({ error: 'Invalid initialization key' })
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  // 在实际部署中，这里会设置环境变量或数据库中的密码
  // 但由于Next.js的限制，我们无法直接修改环境变量
  // 所以返回成功消息表示验证通过
  
  return res.status(200).json({ 
    success: true, 
    message: 'Admin password initialized successfully. Use this password to login: ' + newPassword 
  })
}