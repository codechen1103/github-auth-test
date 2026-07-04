import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession, clearSession } from '@/lib/session'
import { encodeGitHubPath, githubApi } from '@/lib/github'
import { buildTemplateFiles, normalizeConfig } from '@/lib/template'

export const runtime = 'nodejs'

type GitHubRepo = {
  name: string
  full_name: string
  html_url: string
  private: boolean
  owner: { login: string }
}

export async function POST(request: NextRequest) {
  const session = getSession(request)
  if (!session) return NextResponse.json({ error: '请先连接 GitHub' }, { status: 401 })

  try {
    const config = normalizeConfig(await request.json())

    if (config.private && !session.scopes.includes('repo')) {
      return NextResponse.json({ error: '创建私有仓库需要 repo scope。请把 GITHUB_SCOPES 改为包含 repo，然后重新授权。' }, { status: 403 })
    }

    if (!config.private && !session.scopes.includes('public_repo') && !session.scopes.includes('repo')) {
      return NextResponse.json({ error: '创建公开仓库需要 public_repo 或 repo scope。请检查 GITHUB_SCOPES 后重新授权。' }, { status: 403 })
    }

    const repo = await githubApi<GitHubRepo>('/user/repos', session.accessToken, {
      method: 'POST',
      json: {
        name: config.repoName,
        private: config.private,
        auto_init: false,
        description: config.description
      }
    })

    const files = buildTemplateFiles(config)
    for (const [path, content] of Object.entries(files)) {
      await githubApi(`/repos/${repo.owner.login}/${repo.name}/contents/${encodeGitHubPath(path)}`, session.accessToken, {
        method: 'PUT',
        json: {
          message: `Add ${path}`,
          content: Buffer.from(content, 'utf8').toString('base64')
        }
      })
    }

    const vercelCloneUrl = new URL('https://vercel.com/new/clone')
    vercelCloneUrl.searchParams.set('repository-url', repo.html_url)
    vercelCloneUrl.searchParams.set('project-name', repo.name)
    vercelCloneUrl.searchParams.set('repository-name', repo.name)

    const body = {
      repo: {
        full_name: repo.full_name,
        html_url: repo.html_url,
        private: repo.private
      },
      vercelCloneUrl: vercelCloneUrl.toString(),
      tokenCleared: process.env.CLEAR_TOKEN_AFTER_GENERATE === 'true'
    }

    const response = NextResponse.json(body, { status: 201 })
    if (process.env.CLEAR_TOKEN_AFTER_GENERATE === 'true') {
      clearSession(response)
    }
    else {
      setSession(response, session)
    }
    return response
  }
  catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 })
  }
}
