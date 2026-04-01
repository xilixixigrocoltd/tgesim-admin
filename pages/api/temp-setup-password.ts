import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  // 临时设置密码为 Admin2026!
  const { password } = req.body
  if (password !== "temp_setup_key") {
    return res.status(401).json({ error: '临时设置密钥错误' })
  }
  
  // 这里我们只是验证密码正确性，实际部署时会使用环境变量
  // 在实际环境中，ADMIN_PASSWORD 应该设置为 "Admin2026!"
  return res.json({ ok: true, message: '临时验证成功，请使用密码 Admin2026! 登录' })
}