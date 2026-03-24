import type { NextApiRequest, NextApiResponse } from 'next'
import type { GetServerSidePropsContext } from 'next'

export function checkAuth(req: NextApiRequest | GetServerSidePropsContext['req']) {
  const token = req.cookies?.admin_token
  return !!token
}
