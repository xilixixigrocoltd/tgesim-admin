import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 用于调试环境变量
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  res.json({ 
    hasPassword: !!adminPassword, 
    passwordExists: typeof adminPassword === 'string' && adminPassword.length > 0,
    passwordLength: adminPassword ? adminPassword.length : 0
  })
}