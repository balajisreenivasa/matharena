import katex from "katex";

// Renders a raw LaTeX string (no $ delimiters), e.g. an answer choice value.
export function MathTex({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// Renders mixed text that contains inline math wrapped in $...$.
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]*\$)/g);
  return (
    <span>
      {parts.map((p, i) => {
        if (p.length >= 2 && p.startsWith("$") && p.endsWith("$")) {
          const html = katex.renderToString(p.slice(1, -1), { throwOnError: false });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}
