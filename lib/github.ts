export type GitHubUser = {
  id: number
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  email: string | null
}

type GitHubEmail = {
  email: string
  primary: boolean
  verified: boolean
  visibility: string | null
}

export async function exchangeCodeForToken(input: {
  clientId: string
  clientSecret: string
  code: string
  redirectUri: string
}) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      code: input.code,
      redirect_uri: input.redirectUri
    })
  })

  const data = await response.json()
  if (!response.ok || data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to exchange GitHub OAuth code')
  }

  return {
    accessToken: data.access_token as string,
    scopes: String(data.scope || '').split(',').filter(Boolean)
  }
}

export async function githubApi<T>(path: string, accessToken: string, init?: RequestInit & { json?: unknown }) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.json ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers
    },
    body: init?.json ? JSON.stringify(init.json) : init?.body
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.message || `GitHub API failed: ${response.status}`)
  }

  return data as T
}

export async function getCurrentUser(accessToken: string, scopes: string[]) {
  const user = await githubApi<GitHubUser>('/user', accessToken)
  let email = user.email

  if (scopes.includes('user:email')) {
    try {
      const emails = await githubApi<GitHubEmail[]>('/user/emails', accessToken)
      const primary = emails.find((item) => item.primary) || emails.find((item) => item.verified)
      email = email || primary?.email || null
    }
    catch {
      // Public profile email may still be null; keep login usable.
    }
  }

  return {
    id: user.id,
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    html_url: user.html_url,
    email
  }
}

export function encodeGitHubPath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/')
}
