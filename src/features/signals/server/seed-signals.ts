import type { InfoSignal, SignalEvidence } from "@/features/signals/types";
import { hoursSince } from "@/lib/time";

function isoHoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

const now = () => new Date().toISOString();

export function createSeedSignals(): Array<{
  signal: InfoSignal;
  evidence: SignalEvidence[];
}> {
  const publishedOne = isoHoursAgo(2);
  const discoveredOne = isoHoursAgo(1.7);
  const publishedTwo = isoHoursAgo(5);
  const discoveredTwo = isoHoursAgo(4.6);
  const publishedThree = isoHoursAgo(16);
  const discoveredThree = isoHoursAgo(15.8);

  return [
    {
      signal: {
        id: "seed-platform-xhs-traffic",
        title: "小红书疑似放量本地生活长尾搜索内容",
        category: "平台红利",
        tags: ["小红书", "本地生活", "搜索流量"],
        summary:
          "多个新帖提到本地生活关键词在搜索页获得额外曝光，可能是平台在补足长尾商家内容池。",
        whyItMatters:
          "如果搜索流量窗口真实存在，低成本发布城市服务类内容可能比常规笔记更早拿到曝光。",
        sourceUrls: ["https://example.com/xhs/local-search-signal"],
        publishedAt: publishedOne,
        discoveredAt: discoveredOne,
        freshnessHours: hoursSince(publishedOne),
        opportunityScore: 82,
        scoreBreakdown: {
          freshness: 24,
          actionability: 17,
          asymmetry: 13,
          windowUrgency: 12,
          evidenceStrength: 7,
          potentialUpside: 7,
          riskClarity: 2,
        },
        riskLevel: "medium",
        riskWarnings: [
          "平台流量机制可能随时变化，不能假设长期有效。",
          "不要使用批量号、搬运或诱导点击等高风险执行方式。",
        ],
        actionWindow: "24-48 小时",
        suggestedActions: [
          "用浏览器打开原帖和评论区，确认是否有更多同类反馈。",
          "搜索近 24 小时相似关键词，判断是否只是孤例。",
        ],
        evidenceIds: ["seed-evidence-xhs-1", "seed-evidence-xhs-2"],
        status: "new",
        createdAt: now(),
        updatedAt: now(),
      },
      evidence: [
        {
          id: "seed-evidence-xhs-1",
          signalId: "seed-platform-xhs-traffic",
          rawSourceItemId: null,
          url: "https://example.com/xhs/local-search-signal",
          snippet: "发布者提到同城服务类笔记在搜索结果中出现了异常靠前展示。",
          evidenceType: "source_text",
          confidence: 0.78,
          createdAt: now(),
        },
        {
          id: "seed-evidence-xhs-2",
          signalId: "seed-platform-xhs-traffic",
          rawSourceItemId: null,
          url: "https://example.com/xhs/local-search-comment",
          snippet: "评论区有人补充类似关键词在不同城市也出现曝光增加。",
          evidenceType: "comment",
          confidence: 0.64,
          createdAt: now(),
        },
      ],
    },
    {
      signal: {
        id: "seed-policy-subsidy-window",
        title: "某地创业补贴申报窗口疑似提前开放",
        category: "政策补贴",
        tags: ["创业补贴", "地方政策", "申报窗口"],
        summary:
          "地方服务页面出现新的申报入口，公告正文尚未被大量转载，可能存在早期准备窗口。",
        whyItMatters:
          "补贴类机会通常受材料准备周期影响，提前发现入口可以争取更充足的准备时间。",
        sourceUrls: ["https://example.com/gov/subsidy-window"],
        publishedAt: publishedTwo,
        discoveredAt: discoveredTwo,
        freshnessHours: hoursSince(publishedTwo),
        opportunityScore: 77,
        scoreBreakdown: {
          freshness: 21,
          actionability: 16,
          asymmetry: 12,
          windowUrgency: 14,
          evidenceStrength: 8,
          potentialUpside: 5,
          riskClarity: 1,
        },
        riskLevel: "low",
        riskWarnings: [
          "需要以政府官网最终公告和申报系统状态为准。",
          "不要提交虚假材料或伪造资质。",
        ],
        actionWindow: "3 日内核验入口",
        suggestedActions: [
          "打开政府官网确认入口是否真实有效。",
          "整理申报条件、截止日期和所需材料清单。",
        ],
        evidenceIds: ["seed-evidence-policy-1"],
        status: "new",
        createdAt: now(),
        updatedAt: now(),
      },
      evidence: [
        {
          id: "seed-evidence-policy-1",
          signalId: "seed-policy-subsidy-window",
          rawSourceItemId: null,
          url: "https://example.com/gov/subsidy-window",
          snippet: "页面出现新的补贴申报入口，但站内搜索结果还没有形成聚合专题。",
          evidenceType: "source_text",
          confidence: 0.81,
          createdAt: now(),
        },
      ],
    },
    {
      signal: {
        id: "seed-open-source-agent-tool",
        title: "新开源浏览器 Agent 工具开始被开发者快速收藏",
        category: "技术开源",
        tags: ["GitHub", "Browser Agent", "开源工具"],
        summary:
          "一个浏览器自动化 Agent 项目在短时间内获得连续 star，可能反映开发者对登录态网页自动化的需求增加。",
        whyItMatters:
          "项目方向与 MessageGap 的浏览器搜索和登录态爬取能力相关，值得追踪 API 设计和风险边界。",
        sourceUrls: ["https://example.com/github/browser-agent"],
        publishedAt: publishedThree,
        discoveredAt: discoveredThree,
        freshnessHours: hoursSince(publishedThree),
        opportunityScore: 69,
        scoreBreakdown: {
          freshness: 15,
          actionability: 14,
          asymmetry: 11,
          windowUrgency: 8,
          evidenceStrength: 7,
          potentialUpside: 10,
          riskClarity: 4,
        },
        riskLevel: "medium",
        riskWarnings: [
          "登录态自动化必须避免绕过权限和平台风控。",
          "需要检查许可证和依赖安全性。",
        ],
        actionWindow: "本周内跟踪",
        suggestedActions: [
          "查看项目 issue 和 README，判断真实成熟度。",
          "对比 Playwright Core 是否已覆盖项目能力。",
        ],
        evidenceIds: ["seed-evidence-oss-1"],
        status: "new",
        createdAt: now(),
        updatedAt: now(),
      },
      evidence: [
        {
          id: "seed-evidence-oss-1",
          signalId: "seed-open-source-agent-tool",
          rawSourceItemId: null,
          url: "https://example.com/github/browser-agent",
          snippet: "项目 README 强调可复用登录态和结构化页面抽取，近期收藏增速较快。",
          evidenceType: "source_text",
          confidence: 0.72,
          createdAt: now(),
        },
      ],
    },
  ];
}
