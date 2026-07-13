import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "怒江傈僳语共建计划｜新傈僳文词条采集与审核",
  description: "面向怒江地区的新傈僳文（拉丁字母）词条采集、母语者复核与社区共建计划。",
  openGraph: {
    title: "怒江傈僳语共建计划",
    description: "先记录，再校对。由语言使用者共同建设新傈僳文词库。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
