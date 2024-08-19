import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loose RAT Helper",
  description: "Get a litle help creating loose RATs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300"
    >
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%2210 0 100 100%22><text y=%22.90em%22 font-size=%2290%22>🐀</text></svg>"
        ></link>
      </head>
      <body className={`${inter.className} h-full`}>{children}</body>
    </html>
  );
}
