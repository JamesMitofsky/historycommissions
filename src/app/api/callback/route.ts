import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const data = await response.json()
  const token = data.access_token
  const payload = JSON.stringify({ token, provider: 'github' })

  return new NextResponse(
    `<script>
      window.opener.postMessage(
        'authorization:github:success:${payload}',
        '*'
      )
    </script>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
