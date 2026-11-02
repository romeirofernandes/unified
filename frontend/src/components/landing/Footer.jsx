import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, UnionCircleIcon } from "@hugeicons/core-free-icons";

export default function Footer() {
  return (
    <footer className="w-full overflow-hidden bg-[#1d1c1a] px-5 pb-7 pt-12 text-[#f4f3ee] transition-colors duration-700 sm:px-8 sm:pb-9 sm:pt-16 lg:px-12 dark:bg-[#141413] motion-reduce:transition-none">
      <div className="mx-auto w-full max-w-[1320px]">
        <div className="grid gap-10 border-b border-white/15 pb-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-8 sm:pb-12">
          <div className="max-w-[550px]">
            <a className="inline-flex items-center gap-2.5 font-serif text-[23px] leading-none tracking-[-0.035em] text-[#f4f3ee] no-underline" href="/" aria-label="unified home">
              <span className="grid size-9 place-items-center rounded-[12px] border border-[#728ab9] bg-gradient-to-b from-[#879fce] to-[#526d9f] text-white">
                <HugeiconsIcon icon={UnionCircleIcon} size={21} aria-hidden="true" />
              </span>
              unified
            </a>
            <p className="mt-5 max-w-[440px] text-[14px] leading-[1.65] text-[#c3c0b9] sm:text-[15px]">A simpler way to collect feedback, find the thread, and build what matters.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-[14px] sm:justify-end" aria-label="Footer navigation">
            <a className="text-[#dedbd4] no-underline hover:text-white hover:underline" href="#product">Product</a>
            <a className="text-[#dedbd4] no-underline hover:text-white hover:underline" href="#capabilities">Capabilities</a>
            <a className="text-[#dedbd4] no-underline hover:text-white hover:underline" href="/docs">Documentation</a>
            <a className="inline-flex items-center gap-1.5 text-[#dedbd4] no-underline hover:text-white hover:underline" href="https://github.com/romeirofernandes" target="_blank" rel="noreferrer">GitHub <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" /></a>
          </nav>
        </div>

        <p className="m-0 select-none overflow-hidden py-5 font-serif text-[clamp(4.25rem,17vw,15rem)] leading-[0.9] tracking-[-0.065em] text-[#f4f3ee] sm:py-8" aria-label="unified">unified</p>

        <div className="flex flex-col gap-4 border-t border-white/15 pt-5 text-[14px] text-[#c3c0b9] sm:flex-row sm:items-center sm:justify-between sm:pt-6 sm:text-[15px]">
          <p className="m-0">© {new Date().getFullYear()} Unified. Built around the customer voice.</p>
          <p className="m-0 text-[18px] sm:text-[20px]">crafted by <a className="font-medium text-[#f4f3ee] underline decoration-wavy decoration-[#a8b9dd] underline-offset-[5px]" href="https://romeiro.dev">romeiro's</a> agents</p>
        </div>
      </div>
    </footer>
  );
}
