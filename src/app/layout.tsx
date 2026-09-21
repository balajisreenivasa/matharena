import "./globals.css";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MathArena — AMC 10 Prep",
  description: "Adaptive daily lessons, worksheets and mocks for the AMC 10.",
};

const NAV = [
  ["/", "Home"],
  ["/today", "Today"],
  ["/plan", "Plan"],
  ["/diagnostic", "Diagnostic"],
  ["/lessons", "Lessons"],
  ["/progress", "Progress"],
  ["/mock", "Mocks"],
  ["/practice", "Free practice"],
  ["/settings", "Settings"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-4">
            <Link href="/" className="text-xl font-black tracking-tight text-slate-900">
              Math<span className="text-blue-600">Arena</span>
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} className="hover:text-slate-900">{label}</Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
