'use client'

import { useEffect, useState } from 'react'

type Me = {
  user: {
    login: string
    name: string | null
    avatar_url: string
    html_url: string
    email: string | null
  }
  scopes: string[]
}

type GenerateResult = {
  repo: {
    full_name: string
    html_url: string
    private: boolean
  }
  vercelCloneUrl: string
  tokenCleared?: boolean
}

export default function Generator() {
  const [me, setMe] = useState<Me | null>(null)
  const [loadingMe, setLoadingMe] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<GenerateResult | null>(null)

  const [repoName, setRepoName] = useState('my-notes')
  const [siteTitle, setSiteTitle] = useState('我的笔记')
  const [theme, setTheme] = useState('midnight')
  const [description, setDescription] = useState('记录想法、知识和项目。')
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    fetch('/api/me')
      .then(async (res) => {
        if (res.status === 401) return null
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then(setMe)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingMe(false))
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    location.reload()
  }

  async function generateRepo(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoName, siteTitle, theme, description, private: isPrivate })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || JSON.stringify(data, null, 2))
      setResult(data)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card">
      <h2>配置生成器</h2>

      {loadingMe ? <p className="muted">正在检查登录状态...</p> : null}

      {!loadingMe && !me ? (
        <div>
          <p className="muted">你还没有连接 GitHub。先授权后才能创建仓库。</p>
          <a className="button" href="/api/auth/github">连接 GitHub</a>
        </div>
      ) : null}

      {me ? (
        <div className="row" style={{ marginBottom: 16 }}>
          <img className="avatar" src={me.user.avatar_url} alt="avatar" />
          <div>
            <strong>{me.user.name || me.user.login}</strong>
            <div><a href={me.user.html_url} target="_blank" rel="noreferrer">@{me.user.login}</a></div>
            <div className="muted">Scopes: {me.scopes.join(', ') || 'none'}</div>
          </div>
          <button className="danger" type="button" onClick={logout}>退出</button>
        </div>
      ) : null}

      <form onSubmit={generateRepo} className="form-grid">
        <label>
          仓库名
          <input value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder="my-notes" required />
        </label>
        <label>
          站点标题
          <input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} placeholder="我的笔记" required />
        </label>
        <label>
          主题
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="midnight">Midnight</option>
            <option value="paper">Paper</option>
            <option value="forest">Forest</option>
          </select>
        </label>
        <label>
          可见性
          <select value={isPrivate ? 'private' : 'public'} onChange={(e) => setIsPrivate(e.target.value === 'private')}>
            <option value="public">Public，推荐 MVP</option>
            <option value="private">Private，需要 repo scope</option>
          </select>
        </label>
        <label className="full">
          简介
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>
        <div className="full row">
          <button type="submit" disabled={!me || submitting}>{submitting ? '生成中...' : '生成 GitHub 仓库'}</button>
          <span className="muted">公开仓库使用 <code>public_repo</code> scope；私有仓库需要 <code>repo</code> scope。</span>
        </div>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <div>
          <p className="success">生成成功！</p>
          <p><a href={result.repo.html_url} target="_blank" rel="noreferrer">打开 GitHub 仓库：{result.repo.full_name}</a></p>
          <p><a className="button" href={result.vercelCloneUrl} target="_blank" rel="noreferrer">部署到 Vercel</a></p>
          {result.tokenCleared ? <p className="muted">已按配置清除本次 GitHub token。</p> : null}
        </div>
      ) : null}
    </section>
  )
}
