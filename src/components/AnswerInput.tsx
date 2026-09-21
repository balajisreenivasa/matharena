"use client";
// Free-response answer box with a math keyboard and a live rendered preview.
// Students type plain syntax (sqrt(2)+1, 25pi/2, 10 1/12, (3,-1), even) — the
// preview shows what the grader will read, so "did I type it right?" is answered
// before pressing Check. Works with a physical keyboard too; Enter submits.
import { useEffect, useRef, useState } from "react";
import katex from "katex";
import { typedToLatex } from "@/lib/answers";

type Key = { label: string; insert: string; caretBack?: number; title?: string; wide?: boolean; kind?: "digit" | "op" | "fn" | "action" };

const ROWS: Key[][] = [
  [
    { label: "7", insert: "7", kind: "digit" }, { label: "8", insert: "8", kind: "digit" }, { label: "9", insert: "9", kind: "digit" },
    { label: "÷", insert: "/", title: "Fraction or divide: 3/4", kind: "op" }, { label: "(", insert: "(", kind: "op" }, { label: ")", insert: ")", kind: "op" },
    { label: "√", insert: "sqrt()", caretBack: 1, title: "Square root: sqrt(2)", kind: "fn" },
  ],
  [
    { label: "4", insert: "4", kind: "digit" }, { label: "5", insert: "5", kind: "digit" }, { label: "6", insert: "6", kind: "digit" },
    { label: "×", insert: "*", kind: "op" }, { label: "xⁿ", insert: "^", title: "Power: 2^10", kind: "op" }, { label: "π", insert: "pi", kind: "fn" },
    { label: "∛", insert: "^(1/3)", title: "Cube root: 8^(1/3)", kind: "fn" },
  ],
  [
    { label: "1", insert: "1", kind: "digit" }, { label: "2", insert: "2", kind: "digit" }, { label: "3", insert: "3", kind: "digit" },
    { label: "−", insert: "-", kind: "op" }, { label: ",", insert: ",", title: "Pairs and lists: (3,-1)", kind: "op" }, { label: "%", insert: "%", kind: "op" },
    { label: "°", insert: "°", kind: "op" },
  ],
  [
    { label: "0", insert: "0", kind: "digit" }, { label: ".", insert: ".", kind: "digit" }, { label: "+", insert: "+", kind: "op" },
    { label: "a b/c", insert: " /", title: "Mixed number: 10 1/12", kind: "fn" }, { label: "⌫", insert: "\b", kind: "action" }, { label: "Clear", insert: "\x00", kind: "action" },
    { label: "Skip", insert: "\x01", title: "Leave blank, like on the exam", kind: "action" },
  ],
];

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
  busy?: boolean;
  placeholder?: string;
  integerOnly?: boolean;
  autoFocus?: boolean;
  compact?: boolean; // mock mode: no Check button, no skip key
  ariaLabel?: string;
};

export function AnswerInput({ value, onChange, onSubmit, onSkip, disabled, busy, placeholder, integerOnly, autoFocus = true, compact = false, ariaLabel = "Your answer" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [showKeys, setShowKeys] = useState(() => {
    try {
      return localStorage.getItem("mathkeys") !== "off";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus();
  }, [autoFocus, disabled]);

  function toggleKeys() {
    setShowKeys((s) => {
      try {
        localStorage.setItem("mathkeys", s ? "off" : "on");
      } catch {}
      return !s;
    });
  }

  function press(k: Key) {
    if (disabled) return;
    const el = ref.current;
    if (k.insert === "\x01") {
      onSkip?.();
      return;
    }
    if (k.insert === "\x00") {
      onChange("");
      el?.focus();
      return;
    }
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    let next: string;
    let caret: number;
    if (k.insert === "\b") {
      if (start !== end) {
        next = value.slice(0, start) + value.slice(end);
        caret = start;
      } else {
        next = value.slice(0, Math.max(0, start - 1)) + value.slice(end);
        caret = Math.max(0, start - 1);
      }
    } else {
      next = value.slice(0, start) + k.insert + value.slice(end);
      caret = start + k.insert.length - (k.caretBack ?? 0);
    }
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }

  const latex = typedToLatex(value);
  let preview = "";
  if (latex) {
    try {
      preview = katex.renderToString(latex, { throwOnError: false, displayMode: false });
    } catch {
      preview = "";
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim() && !compact) onSubmit(value);
          }}
          disabled={disabled}
          placeholder={placeholder ?? (integerOnly ? "Integer 0-999" : "e.g. 42, 3/4, sqrt(2)+1, 25pi/2, (3,-1), even")}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
          inputMode={integerOnly ? "numeric" : "text"}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={ariaLabel}
        />
        {!compact && (
          <button onClick={() => onSubmit(value)} disabled={disabled || busy || !value.trim()} className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-40">
            {busy ? "Saving…" : "Check"}
          </button>
        )}
      </div>

      <div className="mt-2 flex min-h-[28px] items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          {value.trim() ? (
            <>
              <span className="text-xs text-slate-400">Reads as</span>
              <span className="rounded bg-slate-50 px-2 py-0.5 text-base text-slate-900" dangerouslySetInnerHTML={{ __html: preview }} />
            </>
          ) : (
            <span className="text-xs text-slate-400">Fractions as 3/4, roots as sqrt(2), π as pi, powers as 2^10, words as words.</span>
          )}
        </div>
        {!disabled && (
          <button type="button" onClick={toggleKeys} className="text-xs font-medium text-slate-500 hover:text-slate-800">
            {showKeys ? "Hide keys" : "Math keys"}
          </button>
        )}
      </div>

      {showKeys && !disabled && (
        <div className="mt-2 grid grid-cols-7 gap-1.5 select-none" role="group" aria-label="Math keyboard">
          {ROWS.flat()
            .filter((k) => !(compact && k.insert === "\x01"))
            .map((k) => (
              <button
                key={k.label}
                type="button"
                title={k.title}
                onMouseDown={(e) => e.preventDefault()} // keep focus in the input
                onClick={() => press(k)}
                className={`rounded-lg border py-2 text-base font-semibold ${
                  k.kind === "digit"
                    ? "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                    : k.kind === "action"
                      ? "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm"
                      : "border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100"
                }`}
              >
                {k.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
