import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const infoSignals = sqliteTable("info_signals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  tagsJson: text("tags_json").notNull(),
  summary: text("summary").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  sourceUrlsJson: text("source_urls_json").notNull(),
  publishedAt: text("published_at").notNull(),
  discoveredAt: text("discovered_at").notNull(),
  freshnessHours: real("freshness_hours").notNull(),
  opportunityScore: integer("opportunity_score").notNull(),
  scoreBreakdownJson: text("score_breakdown_json").notNull(),
  riskLevel: text("risk_level").notNull(),
  riskWarningsJson: text("risk_warnings_json").notNull(),
  actionWindow: text("action_window").notNull(),
  suggestedActionsJson: text("suggested_actions_json").notNull(),
  evidenceIdsJson: text("evidence_ids_json").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const signalEvidence = sqliteTable("signal_evidence", {
  id: text("id").primaryKey(),
  signalId: text("signal_id")
    .notNull()
    .references(() => infoSignals.id, { onDelete: "cascade" }),
  rawSourceItemId: text("raw_source_item_id"),
  url: text("url").notNull(),
  snippet: text("snippet").notNull(),
  evidenceType: text("evidence_type").notNull(),
  confidence: real("confidence").notNull(),
  createdAt: text("created_at").notNull(),
});

export const collectionRuns = sqliteTable("collection_runs", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  sourcesSearchedJson: text("sources_searched_json").notNull(),
  urlsDiscovered: integer("urls_discovered").notNull(),
  pagesCrawled: integer("pages_crawled").notNull(),
  candidatesEvaluated: integer("candidates_evaluated").notNull(),
  signalsSaved: integer("signals_saved").notNull(),
  errorsJson: text("errors_json").notNull(),
});

export const agentThreads = sqliteTable("agent_threads", {
  id: text("id").primaryKey(),
  signalId: text("signal_id")
    .notNull()
    .references(() => infoSignals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const agentMessages = sqliteTable("agent_messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id")
    .notNull()
    .references(() => agentThreads.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

export const toolCallEvents = sqliteTable("tool_call_events", {
  id: text("id").primaryKey(),
  threadId: text("thread_id")
    .notNull()
    .references(() => agentThreads.id, { onDelete: "cascade" }),
  messageId: text("message_id"),
  runId: text("run_id").notNull(),
  eventType: text("event_type").notNull(),
  toolName: text("tool_name").notNull(),
  status: text("status").notNull(),
  inputPreviewJson: text("input_preview_json"),
  outputPreviewJson: text("output_preview_json"),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  error: text("error"),
});
