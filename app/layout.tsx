import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "MessageGap",
  description: "本地自用的信息差采集与 Agent 追问工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
