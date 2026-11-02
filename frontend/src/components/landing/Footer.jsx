import { HugeiconsIcon } from "@hugeicons/react";
import { Message01Icon } from "@hugeicons/core-free-icons";

export default function Footer() {
  return (
    <footer className="border-t border-[#d8d5ce] bg-[#eeede7] dark:border-[#45433e] dark:bg-[#252421]">
      <div className="mx-auto grid min-h-[100px] w-full max-w-[1160px] grid-cols-2 items-center gap-x-4 gap-y-4 px-5 py-6 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-6 sm:px-8 sm:py-5">
        <a className="inline-flex w-fit items-center gap-2.5 font-serif text-xl tracking-[-0.055em] text-inherit no-underline" href="/" aria-label="Unified home">
          <span className="grid size-[26px] place-items-center rounded-lg border border-[#7c99d7]/60 bg-gradient-to-br from-white to-[#e5ebf7] text-[#4f6da9]" aria-hidden="true"><HugeiconsIcon icon={Message01Icon} size={16} /></span>
          <span>unified</span>
        </a>
        <p className="col-span-2 m-0 text-xs text-[#817e76] sm:col-span-1">Feedback that helps you build with more context.</p>
        <nav className="col-span-2 flex gap-5 text-xs sm:col-span-1" aria-label="Footer navigation">
          <a className="text-[#625f59] no-underline hover:text-[#1c1b19] dark:text-[#c0bdb5] dark:hover:text-white" href="/docs">Documentation</a>
          <a className="text-[#625f59] no-underline hover:text-[#1c1b19] dark:text-[#c0bdb5] dark:hover:text-white" href="https://github.com/romeirofernandes" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <span className="justify-self-end whitespace-nowrap text-xs text-[#817e76] sm:justify-self-auto">© {new Date().getFullYear()} Unified</span>
        <p className="col-span-2 m-0 text-xs text-[#817e76] sm:col-span-1 sm:whitespace-nowrap">crafted by <a className="text-[#1c1b19] underline decoration-wavy decoration-[#4f6da9] underline-offset-[3px] dark:text-white" href="https://romeiro.dev">romeiro's</a> agents</p>
      </div>
    </footer>
  );
}
