import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'
import { validatePassword, getPassword } from '../../../lib/password-store'
import { initializeStorage } from '../../../lib/storage'

// 初始化存储
initializeStorage().catch(console.error);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { password } = req.body
  
  // 首先检查环境变量中的密码
  if (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
    // 环境变量密码匹配
  } else if (!process.env.ADMIN_PASSWORD && validatePassword(password)) {
    // 环境变量未设置，使用临时密码
  } else {
    return res.status(401).json({ error: '密码错误' })
  }
  
  const token = Buffer.from(`admin:${Date.now()}`).toString('base64')
  res.setHeader('Set-Cookie', serialize('admin_token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 86400 * 7, path: '/'
  }))
  res.json({ ok: true })
}
