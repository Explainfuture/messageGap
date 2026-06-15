# MessageGap 技术决策

日期：2026-06-15

## 1. 已确定技术栈

- 框架：Next.js App Router。
- 前端：React。
- 语言：TypeScript，全项目统一 TS。
- UI 组件：shadcn/ui。
- 样式：Tailwind CSS。
- 后端：Next.js 内置后端能力，包括 Route Handlers、server-side modules、同 repo worker/script。
- 数据库：SQLite，面向本地自用 MVP。
- ORM：Drizzle ORM，用于 schema、迁移和类型安全查询。
- 浏览器自动化：Playwright，用于浏览器搜索、登录态爬取、打开页面、抽取网页内容和后续 Agent 工具调用。
- LLM：DeepSeek，通过自定义 client 封装。
- Agent 流式响应：SSE。

明确不引入：

- 独立 Express 后端。
- 独立 NestJS 后端。
- 大型前端状态管理库，除非后续复杂度真的需要。
- 一页几千行的巨型文件。

## 2. 前后端边界

Next.js 同时承担前端和后端。

前端职责：

- 看板页面。
- 信息差详情页。
- Agent 追问线程 UI。
- 工具调用事件展示。
- 筛选、排序、局部交互状态。

后端职责：

- Browser Search 调用，不接第三方搜索 API。
- 浏览器爬取。
- 登录态浏览器会话管理。
- DeepSeek 调用。
- 信息差筛选和评分。
- 风险识别。
- 数据库存取。
- 采集任务调度。
- Agent 工具运行和事件持久化。

Route Handler 职责应该很薄：

- 解析请求。
- 校验参数。
- 调用 service。
- 返回响应或流式事件。

复杂业务流程必须放到 `src/features/*/server`、`src/agent`、`src/crawler`、`src/search` 等模块。

## 3. 推荐目录结构

```text
messageGap
├── app
│   ├── page.tsx
│   ├── signals
│   │   └── [id]
│   │       └── page.tsx
│   ├── threads
│   │   └── [id]
│   │       └── page.tsx
│   └── api
│       ├── collection
│       ├── signals
│       └── threads
├── src
│   ├── agent
│   │   ├── thread-agent.ts
│   │   ├── tool-runtime.ts
│   │   └── tools
│   ├── components
│   │   └── ui
│   ├── crawler
│   │   ├── browser-crawler.ts
│   │   └── extract-page.ts
│   ├── db
│   │   ├── client.ts
│   │   └── schema.ts
│   ├── deepseek
│   │   ├── client.ts
│   │   └── prompts.ts
│   ├── features
│   │   ├── collection-runs
│   │   ├── signals
│   │   └── threads
│   ├── lib
│   │   ├── env.ts
│   │   ├── time.ts
│   │   └── result.ts
│   ├── scheduler
│   │   └── collection-scheduler.ts
│   ├── search
│   │   ├── search-provider.ts
│   │   └── providers
│   └── skills
│       └── information-gap
├── drizzle
├── prd
└── scripts
```

## 4. 文件拆分规则

强约束：

- 不允许把完整功能写进一个几千行大文件。
- `app/**/page.tsx` 只做页面组合，避免承载复杂业务逻辑。
- `app/api/**/route.ts` 只做请求边界，不写长流程。
- 数据库访问集中在 query/repository/service 文件。
- LLM prompt、工具实现、评分规则、UI 展示必须拆开。

建议上限：

- 页面文件：100 行以内。
- 普通 UI 组件：200 行以内。
- 复杂业务组件：250 行以内，超过就拆子组件或 hook。
- service 文件：300 行以内，超过按流程拆分。
- prompt 文件按场景拆分，不写一个巨型 prompt registry。

## 5. shadcn/ui 使用原则

- `src/components/ui` 只放 shadcn 基础组件。
- 不直接修改 shadcn 组件来写业务逻辑。
- 业务封装放在 `src/features/*/components`。
- Tailwind class 优先在业务组件中组合。
- 重复样式达到真实复用价值时，再抽业务组件。

第一批可能需要的 shadcn 组件：

- Button。
- Card。
- Badge。
- Tabs。
- Input。
- Select。
- ScrollArea。
- Sheet 或 Dialog。
- Table。
- Separator。
- Tooltip。
- Skeleton。

## 6. Agent 与工具调用结构

Agent 线程需要明确拆层：

- `ThreadAgent`：负责对话编排。
- `ToolRuntime`：负责执行工具、发出 `tool_call_use` / `tool_call_end`。
- `tools/web-search`：搜索工具。
- `tools/browser-open`：打开网页工具。
- `tools/page-extract`：页面抽取工具。
- `tools/local-db-lookup`：查询本地信息差和历史线程。

UI 不直接调用具体工具。UI 只提交用户消息，并通过 SSE 消费后端返回的消息流和工具事件。

## 7. 搜索与登录态爬取决策

搜索不接 Tavily、SerpAPI、Bing Search、Exa 等第三方搜索 API。

MVP 统一使用浏览器搜索：

- Playwright 打开搜索引擎。
- 搜索最近 3 日内的新内容。
- 从搜索结果页抽取候选 URL。
- 再用浏览器打开候选页面进行正文和证据抽取。

登录态爬取：

- 使用用户本机可访问的登录态浏览器会话。
- Cookie、localStorage、浏览器 profile 只保存在本地。
- 不把登录态提交到 git。
- 不绕过权限、不绕过风控、不做攻击性爬取。
- 只访问用户自己能正常打开的页面。

## 8. Scheduler 决策

MVP 第一阶段只做手动触发采集。

原因：

- 先把搜索、爬取、筛选、入库、看板闭环跑通。
- 避免一开始就调试后台 worker、进程保活和重复任务问题。
- 后续再接同 repo worker，实现每 4 小时自动运行。

## 9. ORM 说明与决策

ORM 是 Object-Relational Mapping，简单说就是数据库访问层。它负责把 TypeScript 里的表结构、查询和迁移映射到 SQLite 这类关系型数据库，避免手写大量 SQL 字符串，同时保留类型检查。

本项目选择 Drizzle ORM：

- 轻量，适合本地 SQLite。
- TypeScript 类型体验好。
- 查询写法接近 SQL，方便控制复杂查询。
- 不需要引入很重的生成客户端。
- 适合这个项目按模块拆分 repository/service。

## 10. 初始技术待定项

还需要在实现前确认：

- 第一批支持哪些搜索引擎。
- 登录态浏览器 profile 存放路径。
- 第一批真正实现哪些内容平台。
- 是否保存原始 HTML，还是只保存正文和证据片段。
