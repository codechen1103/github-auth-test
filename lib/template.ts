export type GeneratorConfig = {
  repoName: string
  siteTitle: string
  theme: 'midnight' | 'paper' | 'forest'
  description: string
  private: boolean
}

export function normalizeConfig(input: unknown): GeneratorConfig {
  const body = input as Partial<GeneratorConfig>
  const repoName = sanitizeRepoName(body.repoName || 'my-notes')
  const siteTitle = String(body.siteTitle || '我的笔记').trim().slice(0, 80)
  const description = String(body.description || '').trim().slice(0, 240)
  const theme = ['midnight', 'paper', 'forest'].includes(String(body.theme)) ? body.theme as GeneratorConfig['theme'] : 'midnight'

  if (!repoName) throw new Error('仓库名无效')

  return {
    repoName,
    siteTitle: siteTitle || '我的笔记',
    description: description || '记录想法、知识和项目。',
    theme,
    private: Boolean(body.private)
  }
}

export function buildTemplateFiles(config: GeneratorConfig) {
  const colors = {
    midnight: ['#0f172a', '#e2e8f0', '#38bdf8'],
    paper: ['#faf7ef', '#1f2937', '#b45309'],
    forest: ['#052e16', '#dcfce7', '#22c55e']
  }[config.theme]

  const [bg, fg, accent] = colors

  return {
    'README.md': `# ${config.siteTitle}\n\n${config.description}\n\n这个仓库由 GitHub Notes Generator 生成。\n\n## 本地预览\n\n直接打开 \`index.html\` 即可。\n`,
    'index.html': `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(config.siteTitle)}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: ${bg}; color: ${fg}; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { width: min(720px, calc(100vw - 40px)); }
    h1 { font-size: clamp(2.2rem, 7vw, 5rem); letter-spacing: -.06em; margin: 0 0 1rem; }
    p { line-height: 1.8; font-size: 1.1rem; }
    a { color: ${accent}; }
    .card { border: 1px solid color-mix(in srgb, ${fg} 18%, transparent); border-radius: 24px; padding: 32px; background: color-mix(in srgb, ${bg} 82%, ${fg}); box-shadow: 0 24px 80px rgba(0,0,0,.25); }
  </style>
</head>
<body>
  <main class="card">
    <h1>${escapeHtml(config.siteTitle)}</h1>
    <p>${escapeHtml(config.description)}</p>
    <p>第一篇笔记：<a href="./notes/welcome.md">notes/welcome.md</a></p>
  </main>
</body>
</html>
`,
    'notes/welcome.md': `# Welcome\n\n欢迎来到「${config.siteTitle}」。\n\n- 主题：${config.theme}\n- 简介：${config.description}\n`,
    'notes/.gitkeep': ''
  }
}

function sanitizeRepoName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
