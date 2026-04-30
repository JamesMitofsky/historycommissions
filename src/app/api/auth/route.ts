import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export function GET(_req: NextRequest) {
  const { GITHUB_CLIENT_ID, REDIRECT_URI } = process.env
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID!,
    redirect_uri: REDIRECT_URI!,
    scope: 'repo',
  })
  redirect(`https://github.com/login/oauth/authorize?${params}`)
}
