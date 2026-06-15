import {
  callDeepSeek,
  extractDeepSeekText,
  hasDeepSeekConfig,
} from "@/deepseek/client";
import { getBooleanEnv } from "@/lib/env";

import { buildEvidenceDigest, type AgentEvidenceContext } from "./agent-context";

const systemPrompt = `
你是 MessageGap 的调查型 Agent。你要基于已保存的信息差、证据片段和工具结果回答用户追问。

要求：
1. 不要假装已经访问没有访问过的页面。
2. 明确区分“已证实”“推断”“需要继续核验”。
3. 对灰色边缘、小空子、金融和平台规则内容必须提示风险。
4. 不输出违法、欺诈、绕风控、盗号、内幕交易或伪造材料步骤。
5. 给出下一步可执行的核验动作。
6. 回答使用中文，结构清晰，避免空泛。
`;

function fallbackAnswer(userQuestion: string, context: AgentEvidenceContext) {
  const signal = context.signal;
  const relatedText =
    context.relatedSearchResults.length > 0
      ? `我还找到了 ${context.relatedSearchResults.length} 条相似搜索结果，可以作为后续核验线索。`
      : "当前没有执行实时浏览器搜索，结论只基于本地已保存证据。";

  return [
    `基于「${signal.title}」，我会先把它当成一个需要二次核验的早期信号，而不是直接执行的结论。`,
    `当前最强证据是：${signal.summary}`,
    relatedText,
    `下一步建议：${signal.suggestedActions.join("；")}`,
    `风险边界：${signal.riskWarnings.join("；")}`,
    `你的追问是「${userQuestion}」。下一轮可以要求我打开具体来源页、找 24 小时内相似信号，或拆成行动清单。`,
  ].join("\n\n");
}

export async function generateAgentAnswer(params: {
  userQuestion: string;
  context: AgentEvidenceContext;
}) {
  const enabled = getBooleanEnv("ENABLE_DEEPSEEK_AGENT", true);

  if (!enabled || !hasDeepSeekConfig()) {
    return {
      answer: fallbackAnswer(params.userQuestion, params.context),
      mode: "fallback",
    };
  }

  try {
    const response = await callDeepSeek({
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            "用户追问：",
            params.userQuestion,
            "",
            "上下文：",
            buildEvidenceDigest(params.context),
          ].join("\n"),
        },
      ],
    });
    const answer = extractDeepSeekText(response);

    if (!answer) {
      return {
        answer: fallbackAnswer(params.userQuestion, params.context),
        mode: "fallback-empty-response",
      };
    }

    return {
      answer,
      mode: "deepseek",
    };
  } catch (error) {
    return {
      answer: [
        fallbackAnswer(params.userQuestion, params.context),
        "",
        `DeepSeek 暂时不可用，已回退到本地证据回答。错误摘要：${error instanceof Error ? error.message : "unknown"}`,
      ].join("\n"),
      mode: "fallback-error",
    };
  }
}
