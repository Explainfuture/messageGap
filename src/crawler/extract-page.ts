export type ExtractedPage = {
  url: string;
  title: string;
  text: string;
  extractedAt: string;
};

export async function extractReadablePage(page: {
  title: () => Promise<string>;
  url: () => string;
  locator: (selector: string) => {
    allTextContents: () => Promise<string[]>;
  };
}): Promise<ExtractedPage> {
  const [title, textParts] = await Promise.all([
    page.title(),
    page.locator("article, main, p, h1, h2, h3, li").allTextContents(),
  ]);

  return {
    url: page.url(),
    title,
    text: textParts
      .map((part) => part.trim())
      .filter(Boolean)
      .join("\n")
      .slice(0, 20_000),
    extractedAt: new Date().toISOString(),
  };
}
