import type { NextApiRequest, NextApiResponse } from 'next'
import { setPassword } from '../../lib/password-store'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { password, authKey } = req.body
  
  // 临时认证密钥
  const TEMP_AUTH_KEY = 'temp_auth_2026_init'
  
  if (authKey !== TEMP_AUTH_KEY) {
    return res.status(401).json({ error: '认证失败' })
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({ error: '密码长度至少6位' })
  }
  
  setPassword(password)
  
  res.json({ ok: true, message: '临时密码设置成功' })
}