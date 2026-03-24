import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { password } = req.body
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '密码错误' })
  }
  const token = Buffer.from(`admin:${Date.now()}`).toString('base64')
  res.setHeader('Set-Cookie', serialize('admin_token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 86400 * 7, path: '/'
  }))
  res.json({ ok: true })
}
