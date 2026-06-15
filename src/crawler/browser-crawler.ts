import path from "node:path";

import { chromium } from "playwright-core";

import { getEnv } from "@/lib/env";

import { extractReadablePage, type ExtractedPage } from "./extract-page";

export async function crawlWithLoggedInBrowser(url: string): Promise<ExtractedPage> {
  const profileDir = path.resolve(
    process.cwd(),
    getEnv("BROWSER_PROFILE_DIR", ".browser-profile"),
  );
  const executablePath = getEnv("CHROME_EXECUTABLE_PATH");

  const context = await chromium.launchPersistentContext(profileDir, {
    channel: executablePath ? undefined : "chrome",
    executablePath: executablePath || undefined,
    headless: false,
    viewport: { width: 1280, height: 900 },
  });

  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    return extractReadablePage(page);
  } finally {
    await context.close();
  }
}
