import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jev vs LLM vs BERT",
  description: "Classificare email con un LLM, con BERT e con Jev",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="flex items-center gap-6 border-b border-zinc-200 px-6 py-3 text-sm">
          <span className="font-semibold">Jev vs LLM vs BERT</span>
          <Link href="/" className="text-zinc-600 hover:text-zinc-950">
            Playground
          </Link>
          <Link href="/inbox" className="text-zinc-600 hover:text-zinc-950">
            Inbox helpdesk
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
