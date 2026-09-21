// Web-researched, URL-verified reading and video material (data/research/*.json,
// produced by the research agents on 2026-09-20 and copied here). Everything listed is
// posted by its rights-holder or openly licensed; paid books appear only as pointers.
import textbooks from "./research/textbooks.json";
import extra from "./research/resources-extra.json";
import type { Resource } from "./resources";

export type Chapter = { chapter: string; title: string; skillIds: string[] };
export type Book = {
  title: string;
  author?: string;
  url: string;
  free: boolean;
  license?: string;
  hasEndOfChapterProblems?: boolean;
  hasSolutions?: boolean;
  freeExcerpt?: { chapter?: string; title?: string; url: string; note?: string } | null;
  chapters?: Chapter[];
  note?: string;
};
export type VideoSeries = { title: string; url: string; skillIds: string[]; note?: string };
export type ExtraResource = Resource & { note?: string };

const data = textbooks as unknown as { books: Book[]; videoSeries: VideoSeries[]; paid?: { title: string; url: string; note?: string }[]; generatedOn?: string };
const extraByskill = extra as unknown as Record<string, ExtraResource[]>;

export const BOOKS: Book[] = data.books ?? [];
export const VIDEO_SERIES: VideoSeries[] = data.videoSeries ?? [];
export const PAID: { title: string; url: string; note?: string }[] = data.paid ?? [];
export const RESEARCH_DATE = data.generatedOn ?? "2026-09-20";

export type ReadingRef = { book: Book; chapters: Chapter[] };

// Books (free first) with the chapters that teach this skill.
export function readingFor(skillId: string): ReadingRef[] {
  const out: ReadingRef[] = [];
  for (const book of BOOKS) {
    const chapters = (book.chapters ?? []).filter((c) => c.skillIds?.includes(skillId));
    if (chapters.length) out.push({ book, chapters });
  }
  return out.sort((a, b) => Number(b.book.free) - Number(a.book.free));
}

export function videosFor(skillId: string): VideoSeries[] {
  return VIDEO_SERIES.filter((v) => v.skillIds?.includes(skillId));
}

export function extraFor(skillId: string): ExtraResource[] {
  return extraByskill[skillId] ?? [];
}

export function freeBooks(): Book[] {
  return BOOKS.filter((b) => b.free);
}
