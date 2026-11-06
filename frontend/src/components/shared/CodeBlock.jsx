import { Highlight, themes } from "prism-react-renderer";
import { useTheme } from "next-themes";
import { InputCopy } from "@/components/ui/input-copy";

export default function CodeBlock({ code, label = "Code", language }) {
  const { resolvedTheme } = useTheme();
  const syntax =
    language ||
    (/^(npm|npx|pnpm|yarn|bun)\s/.test(code.trimStart()) ? "bash" : "jsx");
  return (
    <figure className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <figcaption className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{label}</span>
        <InputCopy copyOnly value={code} label={label} />
      </figcaption>
      <Highlight
        code={code}
        language={syntax}
        theme={resolvedTheme === "dark" ? themes.vsDark : themes.github}
      >
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre
            aria-label={`${label} code example`}
            className="max-w-full overflow-x-auto p-5 font-mono text-[13px] leading-7 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            tabIndex={0}
          >
            <code>
              {tokens.map((line, index) => (
                <span
                  key={index}
                  {...getLineProps({ line })}
                  className="block min-h-7"
                >
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </span>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </figure>
  );
}
