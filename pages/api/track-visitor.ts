import type { NextApiRequest, NextApiResponse } from 'next'
import { updateVisitorStats } from '@/lib/storage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { userId, action } = req.body
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' })
  }
  
  try {
    await updateVisitorStats(userId, action || 'visit')
    res.json({ ok: true, message: 'Visitor tracked successfully' })
  } catch (error) {
    console.error('Failed to track visitor:', error)
    res.status(500).json({ error: 'Failed to track visitor' })
  }
}