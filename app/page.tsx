import Generator from './components/Generator'

export default function HomePage() {
  return (
    <main className="container">
      <section className="hero">
        <p className="muted">Public GitHub OAuth generator web</p>
        <h1>生成你的客制化笔记仓库</h1>
        <p>
          用户打开这个页面，填写配置，授权 GitHub，然后把定制后的笔记模板推送到自己的仓库。
          生成后会得到 GitHub 仓库链接和 Vercel 部署链接。
        </p>
        <div className="row">
          <a className="button" href="/api/auth/github">连接 GitHub</a>
          <a className="button secondary" href="https://github.com/settings/applications" target="_blank" rel="noreferrer">查看已授权应用</a>
        </div>
      </section>

      <div className="grid">
        <Generator />

        <aside className="card">
          <h2>部署者注意</h2>
          <p className="muted">
            真实 <code>GITHUB_CLIENT_ID</code> 和 <code>GITHUB_CLIENT_SECRET</code> 不放仓库，
            只放在 Vercel 项目的 Environment Variables 里。
          </p>
          <pre>{`APP_URL=https://your-app.vercel.app
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_SCOPES=read:user user:email public_repo
SESSION_SECRET=...`}</pre>
          <p className="muted">
            GitHub OAuth App callback URL：<br />
            <code>https://your-app.vercel.app/api/auth/github/callback</code>
          </p>
        </aside>
      </div>
    </main>
  )
}
