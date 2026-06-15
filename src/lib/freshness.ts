const DAY_MS = 24 * 3_600_000;
const DEFAULT_FRESHNESS_DAYS = 3;

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function toIsoString(value: number) {
  return new Date(value).toISOString();
}

function addRelativeMatchDates(
  dates: number[],
  text: string,
  now: number,
  pattern: RegExp,
  unitMs: number,
) {
  for (const match of text.matchAll(pattern)) {
    const amount = Number(match[1]);
    if (Number.isFinite(amount)) {
      dates.push(now - amount * unitMs);
    }
  }
}

function addAbsoluteMatchDates(dates: number[], text: string) {
  const patterns = [
    /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/g,
    /(20\d{2})年(\d{1,2})月(\d{1,2})日?/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const date = Date.UTC(year, month - 1, day);
      if (Number.isFinite(date)) {
        dates.push(date);
      }
    }
  }

  const englishMonthPattern =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2}),?\s+(20\d{2})\b/gi;

  for (const match of text.matchAll(englishMonthPattern)) {
    const month = MONTH_INDEX[match[1].toLowerCase()];
    const day = Number(match[2]);
    const year = Number(match[3]);
    const date = Date.UTC(year, month, day);
    if (Number.isFinite(date)) {
      dates.push(date);
    }
  }
}

export function inferPublishedAtFromText(
  text: string,
  now = Date.now(),
): string | null {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  const dates: number[] = [];

  addRelativeMatchDates(
    dates,
    normalized,
    now,
    /\b(\d+)\s*(?:minute|minutes|min|mins)\s+ago\b/gi,
    60_000,
  );
  addRelativeMatchDates(
    dates,
    normalized,
    now,
    /\b(\d+)\s*(?:hour|hours|hr|hrs)\s+ago\b/gi,
    3_600_000,
  );
  addRelativeMatchDates(
    dates,
    normalized,
    now,
    /\b(\d+)\s*(?:day|days)\s+ago\b/gi,
    DAY_MS,
  );
  addRelativeMatchDates(
    dates,
    normalized,
    now,
    /\b(\d+)\s*(?:week|weeks)\s+ago\b/gi,
    7 * DAY_MS,
  );
  addRelativeMatchDates(
    dates,
    normalized,
    now,
    /\b(\d+)\s*(?:month|months)\s+ago\b/gi,
    30 * DAY_MS,
  );
  addRelativeMatchDates(
    dates,
    normalized,
    now,
    /\b(\d+)\s*(?:year|years)\s+ago\b/gi,
    365 * DAY_MS,
  );

  addRelativeMatchDates(dates, normalized, now, /(\d+)\s*分钟前/g, 60_000);
  addRelativeMatchDates(dates, normalized, now, /(\d+)\s*小时前/g, 3_600_000);
  addRelativeMatchDates(dates, normalized, now, /(\d+)\s*天前/g, DAY_MS);
  addRelativeMatchDates(dates, normalized, now, /(\d+)\s*(?:周|星期)前/g, 7 * DAY_MS);
  addRelativeMatchDates(dates, normalized, now, /(\d+)\s*(?:个月|月)前/g, 30 * DAY_MS);
  addRelativeMatchDates(dates, normalized, now, /(\d+)\s*年前/g, 365 * DAY_MS);

  if (/\byesterday\b/i.test(normalized) || normalized.includes("昨天")) {
    dates.push(now - DAY_MS);
  }

  if (/\btoday\b/i.test(normalized) || normalized.includes("今天")) {
    dates.push(now);
  }

  addAbsoluteMatchDates(dates, normalized);

  const validDates = dates.filter(Number.isFinite);
  if (validDates.length === 0) {
    return null;
  }

  return toIsoString(Math.max(...validDates));
}

export function isFreshWithinDays(
  value: string,
  freshnessDays = DEFAULT_FRESHNESS_DAYS,
  now = Date.now(),
) {
  const publishedAt = new Date(value).getTime();
  if (!Number.isFinite(publishedAt)) {
    return false;
  }

  return publishedAt <= now && now - publishedAt <= freshnessDays * DAY_MS;
}

export function isStaleTimestampText(
  text: string,
  freshnessDays = DEFAULT_FRESHNESS_DAYS,
  now = Date.now(),
) {
  const inferred = inferPublishedAtFromText(text, now);
  return inferred !== null && !isFreshWithinDays(inferred, freshnessDays, now);
}

export function isGithubUrl(urlValue: string) {
  try {
    const url = new URL(urlValue);
    return url.hostname === "github.com";
  } catch {
    return false;
  }
}
