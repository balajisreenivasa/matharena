"use client";
// Light / dark switch. The chosen theme is stored in localStorage and applied to
// <html class="dark"> before first paint by the inline script in layout.tsx, so there
// is no flash. Defaults to the OS preference.
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }
  return (
    <button type="button" onClick={toggle} title={dark ? "Switch to light mode" : "Switch to dark mode"} aria-label="Toggle dark mode" className="rounded-lg border border-slate-300 px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-100">
      {dark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}

// Runs before hydration; keep it tiny and dependency-free.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;
