import "./globals.css";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle, THEME_INIT_SCRIPT } from "@/components/ThemeToggle";
import { getLearnerOrNull } from "@/lib/learner";
import { isEducator } from "@/lib/classroom";

export const metadata: Metadata = {
  title: "MathArena — AMC 10 Prep",
  description: "Adaptive daily lessons, worksheets and mocks for the AMC 10.",
};

export const dynamic = "force-dynamic";

const NAV = [
  ["/", "Home"],
  ["/today", "Today"],
  ["/plan", "Plan"],
  ["/lessons", "Lessons"],
  ["/skills", "Skills"],
  ["/resources", "Library"],
  ["/progress", "Progress"],
  ["/mock", "Mocks"],
  ["/practice", "Practice"],
  ["/settings", "Settings"],
];

// Parents and teachers have no plan of their own: they see their classrooms plus
// the reference material.
const EDUCATOR_NAV = [
  ["/classroom", "Classrooms"],
  ["/lessons", "Lessons"],
  ["/resources", "Library"],
  ["/practice", "Practice"],
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const learner = await getLearnerOrNull();
  const nav = learner && isEducator(learner) ? EDUCATOR_NAV : NAV;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-4">
            <Link href="/" className="text-xl font-black tracking-tight text-slate-900">
              Math<span className="text-blue-600">Arena</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
              {learner && nav.map(([href, label]) => (
                <Link key={href} href={href} className="hover:text-slate-900">{label}</Link>
              ))}
              {learner ? (
                <Link href="/profile" className="rounded-full border border-slate-300 px-3 py-1 text-slate-800 hover:bg-slate-100" title="Profile">
                  {learner.name.split(" ")[0]}
                </Link>
              ) : (
                <Link href="/login" className="hover:text-slate-900">Sign in</Link>
              )}
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
