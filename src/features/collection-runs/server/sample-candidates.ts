import type { CollectionCandidate } from "./collection-candidate";

function isoMinutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function createSampleCandidates(): CollectionCandidate[] {
  return [
    {
      title: "Reddit 新帖讨论学生项目申请的隐藏截止窗口",
      category: "升学深造",
      url: "https://example.com/reddit/exchange-hidden-window",
      sourceName: "reddit",
      snippet:
        "新帖提到某交换项目的院系内部截止日期早于公开页面，评论区出现多个学校相似情况。",
      publishedAt: isoMinutesAgo(28),
      discoveredAt: isoMinutesAgo(4),
    },
    {
      title: "GitHub 项目展示新型网页抽取 Agent 模式",
      category: "技术开源",
      url: "https://example.com/github/new-extraction-agent",
      sourceName: "github",
      snippet:
        "项目刚发布，强调登录态浏览器、结构化抽取和工具调用日志，和本项目技术方向高度相关。",
      publishedAt: isoMinutesAgo(44),
      discoveredAt: isoMinutesAgo(5),
    },
    {
      title: "本地生活服务评论区出现批量商家对新规则的反馈",
      category: "平台红利",
      url: "https://example.com/xhs/local-rule-feedback",
      sourceName: "xiaohongshu",
      snippet:
        "评论区多名商家提到新发布内容在搜索页曝光上升，但主站还没有官方说明。",
      publishedAt: isoMinutesAgo(17),
      discoveredAt: isoMinutesAgo(3),
    },
  ];
}
