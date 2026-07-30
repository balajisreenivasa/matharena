// Local difficulty (position within a contest) -> label/color.
export const LOCAL_DIFFICULTY: Record<number, { label: string; color: string }> = {
  1: { label: "Warm-up", color: "#16a34a" },
  2: { label: "Core", color: "#2563eb" },
  3: { label: "Hard", color: "#d97706" },
  4: { label: "Very hard", color: "#dc2626" },
};
export function globalBand(g: number): string {
  if (g <= 2) return "Intro";
  if (g <= 4) return "Easy";
  if (g <= 6) return "Medium";
  if (g <= 8) return "Hard";
  return "Elite";
}
