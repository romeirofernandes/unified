import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, UnionCircleIcon } from "@hugeicons/core-free-icons";

const rulerMarks = Array.from({ length: 17 }, (_, index) => index);

export default function Footer() {
  return (
    <footer className="w-full overflow-hidden bg-[#1d1c1a] px-5 pb-6 pt-10 text-[#f4f3ee] transition-colors duration-700 sm:px-8 sm:pb-8 sm:pt-12 lg:px-12 dark:bg-[#141413] motion-reduce:transition-none">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="grid gap-8 border-b border-white/15 pb-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-7 sm:pb-10">
          <div className="max-w-[520px]">
            <a className="inline-flex items-center gap-2.5 font-serif text-[21px] leading-none tracking-[-0.035em] text-[#f4f3ee] no-underline" href="/" aria-label="unified home">
              <span className="grid size-8 place-items-center rounded-[11px] border border-[#728ab9] bg-gradient-to-b from-[#879fce] to-[#526d9f] text-white">
                <HugeiconsIcon icon={UnionCircleIcon} size={19} aria-hidden="true" />
              </span>
              unified
            </a>
            <p className="mt-4 max-w-[420px] text-[13px] leading-[1.65] text-[#c3c0b9] sm:text-[14px]">A simpler way to collect feedback, find the thread, and build what matters.</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2.5 text-[13px] sm:justify-end" aria-label="Footer navigation">
            <a className="text-[#dedbd4] no-underline hover:text-white hover:underline" href="#product">Product</a>
            <a className="text-[#dedbd4] no-underline hover:text-white hover:underline" href="#capabilities">Capabilities</a>
            <a className="text-[#dedbd4] no-underline hover:text-white hover:underline" href="/docs">Documentation</a>
            <a className="inline-flex items-center gap-1.5 text-[#dedbd4] no-underline hover:text-white hover:underline" href="https://github.com/romeirofernandes" target="_blank" rel="noreferrer">GitHub <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} aria-hidden="true" /></a>
          </nav>
        </div>

        <div className="relative my-7 border border-white/20 px-3 pb-4 pt-5 sm:my-9 sm:px-6 sm:pb-5 sm:pt-6">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#1d1c1a] px-2 font-mono text-[9px] tracking-[0.08em] text-[#aaa69e] dark:bg-[#141413] sm:text-[10px]">1200 px</div>
          <span className="absolute -left-2 top-1/2 -translate-y-1/2 bg-[#1d1c1a] px-1 font-mono text-[8px] tracking-[0.05em] text-[#aaa69e] [writing-mode:vertical-rl] dark:bg-[#141413] sm:text-[9px]">216 px</span>
          <div className="mb-1 flex items-center justify-between font-mono text-[8px] tracking-[0.04em] text-[#817e76] sm:text-[9px]">
            <span>x: 0 px</span>
            <div className="flex h-2 flex-1 items-start justify-between px-2 sm:px-5" aria-hidden="true">
              {rulerMarks.map((mark) => <span className="h-1.5 w-px bg-white/25" key={mark} />)}
            </div>
            <span>x: 1200 px</span>
          </div>
          <p className="m-0 select-none text-center font-serif text-[clamp(3rem,11.5vw,9rem)] leading-[0.94] tracking-[0.065em] text-transparent [-webkit-text-stroke:1px_rgba(244,243,238,0.62)] sm:[-webkit-text-stroke:1.5px_rgba(244,243,238,0.62)]" aria-label="unified">unified</p>
          <div className="mt-1 flex items-end justify-between font-mono text-[8px] tracking-[0.04em] text-[#817e76] sm:text-[9px]">
            <span>01 / 01</span>
            <div className="flex h-2 flex-1 items-end justify-between px-2 sm:px-5" aria-hidden="true">
              {rulerMarks.map((mark) => <span className="h-1.5 w-px bg-white/25" key={mark} />)}
            </div>
            <span>y: 216 px</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/15 pt-4 text-[12px] text-[#c3c0b9] sm:flex-row sm:items-center sm:justify-between sm:pt-5 sm:text-[13px]">
          <p className="m-0">© {new Date().getFullYear()} Unified. Built around the customer voice.</p>
          <p className="m-0 text-[16px] sm:text-[18px]">crafted by <a className="group relative inline-block font-medium text-[#f4f3ee] no-underline after:absolute after:inset-x-0 after:-bottom-1 after:h-[3px] after:bg-[linear-gradient(90deg,#7c99d7_0%,#e7ecf6_48%,#7c99d7_100%)] after:bg-[length:200%_100%] after:content-[''] group-hover:after:animate-[shimmer_1.1s_linear_infinite] motion-reduce:group-hover:after:animate-none" href="https://romeiro.dev">romeiro&apos;s</a> agents</p>
        </div>
      </div>
    </footer>
  );
}
