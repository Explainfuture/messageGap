import { signalCategories, type SignalCategory } from "@/features/signals/types";

export type CollectionQuery = {
  category: SignalCategory;
  query: string;
};

type BuildCollectionQueriesOptions = {
  queriesPerCategory?: number;
};

const categoryQueryMap: Record<SignalCategory, string[]> = {
  考公考编: ["考公 报名 窗口 新公告", "事业单位 招聘 冷门 岗位"],
  升学深造: ["保研 夏令营 导师 招生 新通知", "留学 交换 项目 申请 窗口"],
  大厂求职: ["大厂 实习 内推 HC 新开", "校招 补录 笔试 面试 信息"],
  赚钱副业: ["副业 现金流 新需求", "平台任务 低成本 服务 机会"],
  创业机会: ["新需求 小生意 供需错配", "创业 机会 新品类 冷启动"],
  政策补贴: ["政策补贴 申报 窗口 新发布", "资质认定 补贴 公告"],
  竞赛项目: ["竞赛 项目 申报 奖金 新通知", "黑客松 训练营 报名"],
  技术开源: ["GitHub new browser agent", "开源 AI 自动化 红利"],
  金融市场: ["市场异动 政策 风险 预警", "行业变化 监管 新规"],
  平台红利: ["平台规则 流量 红利 新变化", "小红书 搜索流量 新规则"],
  合规风险: ["合规 风险 监管 处罚 新规", "平台封禁 规则 风险"],
  城市资源: ["城市 消费券 落户 活动 新发布", "本地生活 资源 开放"],
};

export function buildCollectionQueries({
  queriesPerCategory = Number.POSITIVE_INFINITY,
}: BuildCollectionQueriesOptions = {}): CollectionQuery[] {
  return signalCategories.flatMap((category) =>
    categoryQueryMap[category]
      .slice(0, queriesPerCategory)
      .map((query) => ({
        category,
        query,
      })),
  );
}
