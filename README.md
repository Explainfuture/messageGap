# MessageGap

MessageGap 是一个本地自用的 Next.js Agent 应用，用来采集最近 3 日内的新信息差信号，并基于已保存信号开启 Agent 追问线程。

## 当前能力

- 信息差看板：首页展示 seed 数据和手动采集结果。
- 手动采集：`POST /api/collection/run`。
- 默认采集模式：fixture 数据，保证本地闭环稳定可跑。
- 实时采集模式：通过 Playwright 驱动浏览器搜索，不接第三方搜索 API。
- 登录态爬取：通过本机浏览器 profile 访问用户自己能正常打开的页面。
- DeepSeek 评估：可选开启，失败时自动回退本地启发式评分。
- Agent 追问线程：从信息差详情页创建线程，通过 SSE 展示消息和工具事件。
- 工具事件：支持 `tool_call_use` 和 `tool_call_end` 持久化与前端展示。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui 风格基础组件
- Drizzle ORM
- SQLite
- Playwright Core
- DeepSeek API
- SSE

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:3000
```

## 环境变量

复制 `.env.example` 为 `.env.local` 后按需调整。

```bash
cp .env.example .env.local
```

关键配置：

- `ENABLE_LIVE_BROWSER_SEARCH=false`
  - `false`：使用 fixture 候选数据。
  - `true`：使用 Playwright 打开浏览器搜索。
- `ENABLE_LIVE_PAGE_CRAWL=false`
  - `true`：对候选 URL 做页面正文抽取。
- `MAX_LIVE_PAGE_CRAWLS=3`
  - 每次采集最多抽取多少个候选页面。
- `MAX_SEARCH_TASKS_PER_RUN=4`
  - 每次采集最多跑多少个分类搜索任务。
- `ENABLE_DEEPSEEK_EVALUATION=false`
  - `true`：调用 DeepSeek 做结构化信息差筛选。
- `DEEPSEEK_API_KEY=`
  - DeepSeek API Key。
- `BROWSER_PROFILE_DIR=.browser-profile`
  - 登录态浏览器 profile 存放目录，已被 `.gitignore` 忽略。
- `CHROME_EXECUTABLE_PATH=`
  - 如本机 Chrome 无法自动发现，可填写 Chrome 可执行文件路径。

## 验证命令

```bash
npm run lint
npm run typecheck
npm run build
```

## 目录约束

- `app/**/page.tsx` 只做路由级组合。
- `app/api/**/route.ts` 只做请求边界。
- 采集逻辑放在 `src/features/collection-runs/server`。
- 信息差业务放在 `src/features/signals`。
- Agent 和工具运行时放在 `src/agent`。
- shadcn 风格基础组件放在 `src/components/ui`。
- 不写几千行大文件，复杂逻辑按 service、repository、component、tool 拆分。

## 注意事项

实时浏览器搜索和登录态爬取只应用于用户自己能正常打开的页面。不要绕过权限、风控、登录限制或平台规则。
