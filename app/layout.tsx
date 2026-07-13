import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "怒江声译｜新傈僳文翻译工作台",
  description: "面向怒江地区的新傈僳文（拉丁字母）中文—傈僳语语音翻译与词条共建原型。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
