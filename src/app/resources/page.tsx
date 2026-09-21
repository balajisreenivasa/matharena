import Link from "next/link";
import { BOOKS, VIDEO_SERIES, PAID, RESEARCH_DATE } from "@/curriculum/research";
import { PAST_PAPERS } from "@/curriculum/resources";
import { SKILL_BY_ID, TOPIC_META } from "@/curriculum/skills";

export const dynamic = "force-dynamic";

// Library page: every free textbook, courseware, problem archive and video series the
// research pass verified, with the chapters mapped to our skills.
export default function ResourcesPage() {
  const free = BOOKS.filter((b) => b.free);
  const paidBooks = BOOKS.filter((b) => !b.free);
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-black text-slate-900">Library</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">
        Free, legitimately posted reading and problem sources, URL-verified on {RESEARCH_DATE}. Each lesson page links to the chapters and videos for that skill; this is the whole shelf.
        Sources with <b>solved end-of-chapter problems</b> are marked ✓✓.
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-slate-800">Free textbooks, courseware & problem archives</h2>
        <div className="space-y-3">
          {free.map((b) => (
            <div key={b.url} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <a href={b.url} target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline">{b.title}</a>
                {b.author && <span className="text-xs text-slate-500">{b.author}</span>}
                <span className="ml-auto text-xs text-slate-500">{b.hasEndOfChapterProblems ? (b.hasSolutions ? "✓✓ problems with solutions" : "✓ problems") : ""}</span>
              </div>
              {b.license && <div className="mt-1 text-xs text-slate-500">{b.license.length > 220 ? b.license.slice(0, 220) + "…" : b.license}</div>}
              {b.note && <div className="mt-1 text-sm text-slate-700">{b.note}</div>}
              {b.freeExcerpt?.url && <div className="mt-1 text-sm"><a href={b.freeExcerpt.url} target="_blank" rel="noreferrer" className="text-blue-700 underline">Free chapter{b.freeExcerpt.chapter ? ` ${b.freeExcerpt.chapter}` : ""}{b.freeExcerpt.title ? `: ${b.freeExcerpt.title}` : ""}</a></div>}
              {b.chapters && b.chapters.length > 0 && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">Chapters → skills ({b.chapters.filter((c) => c.skillIds.length).length} mapped)</summary>
                  <ul className="mt-1 grid gap-0.5 sm:grid-cols-2">
                    {b.chapters.map((c) => (
                      <li key={c.chapter + c.title} className="text-slate-700">
                        <span className="font-mono text-xs text-slate-400">{c.chapter}</span> {c.title}
                        {c.skillIds.map((id) => SKILL_BY_ID[id] && (
                          <Link key={id} href={`/lessons/${id}`} className="ml-1 rounded-full px-1.5 text-[10px] font-semibold text-white" style={{ backgroundColor: TOPIC_META[SKILL_BY_ID[id].topicSlug].color }}>{SKILL_BY_ID[id].name}</Link>
                        ))}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-slate-800">Video series</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {VIDEO_SERIES.map((v) => (
            <div key={v.url} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
              <a href={v.url} target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline">▶ {v.title}</a>
              {v.note && <div className="mt-1 text-slate-700">{v.note}</div>}
              <div className="mt-1 flex flex-wrap gap-1">{v.skillIds.map((id) => SKILL_BY_ID[id] && <Link key={id} href={`/lessons/${id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">{SKILL_BY_ID[id].name}</Link>)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-slate-800">Past papers</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">{PAST_PAPERS.map((p) => <li key={p.url}><a href={p.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{p.label}</a></li>)}</ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-800">Worth buying</h2>
        <div className="space-y-2 text-sm">
          {[...paidBooks.map((b) => ({ title: b.title, url: b.url, note: b.note ?? b.license })), ...PAID].map((p) => (
            <div key={p.url + p.title} className="rounded-xl border border-slate-200 bg-white p-3">
              <a href={p.url} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">{p.title}</a>
              {p.note && <div className="mt-0.5 text-xs text-slate-600">{p.note.length > 260 ? p.note.slice(0, 260) + "…" : p.note}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
