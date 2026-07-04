# github-auth-test

一个可部署到 Vercel 的公共配置 Web MVP：用户打开页面、填写笔记模板配置、授权 GitHub，然后把客制化后的文件推送到用户自己的 GitHub 仓库，最后得到一个 Vercel 部署链接。

## 这套方案里谁配置 OAuth App？

- 你部署的官方生成器：由你配置 GitHub OAuth App，并把 `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` 放在你的 Vercel 项目环境变量里。
- 普通使用者：不需要配置 OAuth App，只需要在 GitHub 授权你的 App。
- 自部署者：如果别人 fork 后部署自己的生成器，他们需要创建自己的 GitHub OAuth App。

## 本地开发

```bash
cd github-auth-test
cp .env.example .env.local
npm install
npm run dev
```

本地 GitHub OAuth App 配置：

```txt
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/auth/github/callback
```

`.env.local`：

```env
APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=你的本地 OAuth App Client ID
GITHUB_CLIENT_SECRET=你的本地 OAuth App Client Secret
GITHUB_SCOPES=read:user user:email public_repo
SESSION_SECRET=用 openssl rand -base64 32 生成
CLEAR_TOKEN_AFTER_GENERATE=false
```

## 部署到 Vercel

### 1. 先部署项目

把这个目录推到 GitHub，然后在 Vercel 里导入项目。

首次部署如果还没有环境变量，可能会失败，没关系，配置环境变量后 Redeploy。

### 2. 创建 GitHub OAuth App

打开：

<https://github.com/settings/developers>

选择：

```txt
OAuth Apps -> New OAuth App
```

假设你的 Vercel 域名是：

```txt
https://your-generator.vercel.app
```

填写：

```txt
Application name: Your Notes Generator
Homepage URL: https://your-generator.vercel.app
Authorization callback URL: https://your-generator.vercel.app/api/auth/github/callback
```

创建后复制：

```txt
Client ID
Client Secret
```

建议：不要启用 Device Flow。

### 3. 在 Vercel 配置环境变量

进入你的 Vercel Project：

```txt
Settings -> Environment Variables
```

添加这些变量：

```env
APP_URL=https://your-generator.vercel.app
GITHUB_CLIENT_ID=你的 GitHub OAuth App Client ID
GITHUB_CLIENT_SECRET=你的 GitHub OAuth App Client Secret
GITHUB_SCOPES=read:user user:email public_repo
SESSION_SECRET=一个长随机字符串
CLEAR_TOKEN_AFTER_GENERATE=false
```

`SESSION_SECRET` 可在本地生成：

```bash
openssl rand -base64 32
```

作用环境建议至少选择：

```txt
Production
```

如果你也要在 Preview 部署里测试 OAuth，则 Preview 也要加。但 GitHub OAuth App 的 callback URL 必须匹配 Preview 域名；OAuth App 只有一个 callback URL 时，Preview 会比较麻烦。建议先只测 Production。

配置后点击 Redeploy，让新环境变量生效。





## 常见错误：授权后 Vercel 显示无法处理此请求 / 500

如果 GitHub 授权页面已经出现，点击授权后 Vercel 显示：

```txt
该网页无法正常运作
... 目前无法处理此请求
```

通常是 callback 服务端报错。优先检查 Vercel 环境变量：

```env
GITHUB_CLIENT_SECRET=必须是 GitHub OAuth App 的真实 Client Secret
SESSION_SECRET=必须是长随机字符串，不能是 replace_with_a_long_random_secret
APP_URL=https://你的正式域名.vercel.app
```

尤其是 `SESSION_SECRET` 很容易漏填。可以本地生成：

```bash
openssl rand -base64 32
```

改完 Vercel 环境变量后必须 Redeploy。也可以到：

```txt
Vercel Project -> Deployments -> 当前部署 -> Functions / Runtime Logs
```

查看具体错误。

## 常见错误：Invalid OAuth state or missing code

这个错误通常不是 GitHub secret 错，而是域名不一致。常见有两种表现：

1. GitHub 页面显示 `The redirect_uri is not associated with this application.`
2. 回到应用后显示 `oauth_state_invalid` 或 `missing_state_cookie_domain_or_cookie_blocked`

最常见原因是：

```txt
用户点击登录的域名      https://xxx-git-main-user.vercel.app
APP_URL / callback 域名 https://xxx.vercel.app
```

cookie 是按域名保存的。如果开始登录和回调不是同一个域名，callback 就读不到登录前写入的 state cookie。

建议：

1. 生产环境固定使用一个域名，例如 `https://your-generator.vercel.app` 或你的自定义域名；
2. GitHub OAuth App 的 callback URL 填这个固定域名：

```txt
https://your-generator.vercel.app/api/auth/github/callback
```

3. Vercel `APP_URL` 也填同一个域名；
4. 不要在 Preview Deployment 域名上测试同一个 OAuth App，除非你也给该域名单独建 OAuth App；
5. 修改 Vercel 环境变量后要 Redeploy。



代码现在会固定使用 `APP_URL` 作为 OAuth `redirect_uri`。如果你从 Vercel preview 域名点击登录，会先跳转到 `APP_URL` 再开始 OAuth。

所以这三处必须完全一致：

```txt
用户访问的生产域名
Vercel APP_URL
GitHub OAuth App Authorization callback URL 的域名
```

## 权限说明

默认：

```env
GITHUB_SCOPES=read:user user:email public_repo
```

这允许：

- 读取 GitHub 用户基础信息；
- 读取邮箱；
- 创建/写入公开仓库。

如果要支持私有仓库，需要：

```env
GITHUB_SCOPES=read:user user:email repo
```

但 `repo` 权限很大，用户授权时会更敏感。MVP 建议先只支持 public repo。

## 安全注意

- 不要把 `.env.local` 提交到 Git。
- 不要使用 `NEXT_PUBLIC_GITHUB_CLIENT_SECRET`。
- `GITHUB_CLIENT_SECRET` 只在服务端 Route Handler 里读取。
- 关闭 GitHub OAuth App 的 Device Flow。
- 不要把 GitHub access token 返回给前端。
- `CLEAR_TOKEN_AFTER_GENERATE=true` 可以在生成仓库后清除登录 cookie，更适合一次性生成器。

## 主要路由

```txt
/                                      配置页面
/api/auth/github                       开始 GitHub OAuth
/api/auth/github/callback              GitHub OAuth 回调
/api/me                                当前登录用户
/api/generate                          创建仓库并写入模板文件
/api/auth/logout                       退出
```

## 参考文档

- GitHub OAuth Apps: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
- GitHub OAuth Web flow: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- GitHub Create repository API: https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Next.js Environment Variables: https://nextjs.org/docs/app/guides/environment-variables
