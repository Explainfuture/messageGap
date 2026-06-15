import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const databasePath = path.join(process.cwd(), "data", "messagegap.sqlite");
const databaseDirectory = path.dirname(databasePath);

if (!fs.existsSync(databaseDirectory)) {
  fs.mkdirSync(databaseDirectory, { recursive: true });
}

const sqlite = new Database(databasePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

let isBootstrapped = false;

export function ensureDatabase() {
  if (isBootstrapped) {
    return;
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS info_signals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      summary TEXT NOT NULL,
      why_it_matters TEXT NOT NULL,
      source_urls_json TEXT NOT NULL,
      published_at TEXT NOT NULL,
      discovered_at TEXT NOT NULL,
      freshness_hours REAL NOT NULL,
      opportunity_score INTEGER NOT NULL,
      score_breakdown_json TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      risk_warnings_json TEXT NOT NULL,
      action_window TEXT NOT NULL,
      suggested_actions_json TEXT NOT NULL,
      evidence_ids_json TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS signal_evidence (
      id TEXT PRIMARY KEY,
      signal_id TEXT NOT NULL,
      raw_source_item_id TEXT,
      url TEXT NOT NULL,
      snippet TEXT NOT NULL,
      evidence_type TEXT NOT NULL,
      confidence REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(signal_id) REFERENCES info_signals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collection_runs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      sources_searched_json TEXT NOT NULL,
      urls_discovered INTEGER NOT NULL,
      pages_crawled INTEGER NOT NULL,
      candidates_evaluated INTEGER NOT NULL,
      signals_saved INTEGER NOT NULL,
      errors_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_threads (
      id TEXT PRIMARY KEY,
      signal_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(signal_id) REFERENCES info_signals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(thread_id) REFERENCES agent_threads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tool_call_events (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      message_id TEXT,
      run_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      status TEXT NOT NULL,
      input_preview_json TEXT,
      output_preview_json TEXT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      error TEXT,
      FOREIGN KEY(thread_id) REFERENCES agent_threads(id) ON DELETE CASCADE
    );
  `);

  isBootstrapped = true;
}
