import { useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Menu01Icon,
  UnionCircleIcon,
} from "@hugeicons/core-free-icons";
import ThemeToggle from "./ThemeToggle";

const links = [
  { label: "Capabilities", href: "#capabilities" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Docs", href: "/docs" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#d8d5ce] bg-[#f4f3ee]/95 text-[#24231f] backdrop-blur-xl transition-colors duration-700 dark:border-[#44423d] dark:bg-[#211f1d]/95 dark:text-[#f4f1e9] motion-reduce:transition-none">
      <div className="mx-auto grid min-h-[64px] w-full max-w-[1200px] grid-cols-[1fr_auto] items-center gap-4 px-5 sm:min-h-[72px] sm:grid-cols-[1fr_auto_1fr] sm:px-8 lg:px-12">
        <Link
          className="inline-flex w-fit items-center gap-2 font-serif text-[22px] leading-none tracking-[-0.045em] text-inherit no-underline sm:text-[24px]"
          to="/"
          aria-label="unified home"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-[13px] border border-[#496699] bg-gradient-to-b from-[#9bb3e3] to-[#6e8dc9] text-white shadow-[0_2px_0_#405783,0_5px_12px_rgb(28_27_25_/_14%)]">
            <HugeiconsIcon icon={UnionCircleIcon} size={21} aria-hidden="true" />
          </span>
          <span>unified</span>
        </Link>

        <nav className="hidden items-center justify-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map((link) => link.href.startsWith("/") ? (
            <Link key={link.label} className="text-[14px] text-[#5d5a54] no-underline transition-colors hover:text-[#1c1b19] dark:text-[#c4c0b7] dark:hover:text-white" to={link.href}>{link.label}</Link>
          ) : (
            <a key={link.label} className="text-[14px] text-[#5d5a54] no-underline transition-colors hover:text-[#1c1b19] dark:text-[#c4c0b7] dark:hover:text-white" href={link.href}>{link.label}</a>
          ))}
        </nav>

        <div className="hidden items-center justify-end gap-3 sm:flex">
          <ThemeToggle />
          <Link
            className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-[13px] border-2 border-[#30456d] bg-gradient-to-b from-[#5575b4] to-[#405783] px-4 text-[13px] font-normal text-white shadow-[0_1px_0_#26385b,0_4px_8px_rgb(28_27_25_/_17%)] transition-[filter,transform,box-shadow] duration-200 hover:-translate-y-px hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#496699] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f3ee] active:translate-y-0 active:shadow-[0_1px_0_#26385b] dark:focus-visible:ring-offset-[#211f1d]"
            to="/signup"
          >
            Get started
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle compact />
          <button
            className="grid size-11 place-items-center rounded-[14px] border border-[#d2cfc7] bg-white/70 text-[#24231f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#496699] dark:border-[#4a4842] dark:bg-[#302e2a] dark:text-white"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={21} aria-hidden="true" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="landing-mobile-nav" className="absolute inset-x-0 top-full grid gap-1 border-b border-[#d8d5ce] bg-[#f4f3ee] px-5 py-4 shadow-xl sm:px-8 lg:hidden dark:border-[#44423d] dark:bg-[#211f1d]" aria-label="Mobile navigation">
          {links.map((link) => link.href.startsWith("/") ? (
            <Link key={link.label} className="rounded-xl px-4 py-3 text-[15px] text-inherit no-underline hover:bg-black/5 dark:hover:bg-white/5" to={link.href} onClick={closeMenu}>{link.label}</Link>
          ) : (
            <a key={link.label} className="rounded-xl px-4 py-3 text-[15px] text-inherit no-underline hover:bg-black/5 dark:hover:bg-white/5" href={link.href} onClick={closeMenu}>{link.label}</a>
          ))}
          <Link
            className="mt-2 inline-flex min-h-10 items-center justify-center rounded-[13px] border-2 border-[#30456d] bg-gradient-to-b from-[#5575b4] to-[#405783] px-4 text-[13px] font-normal text-white shadow-[0_1px_0_#26385b,0_4px_8px_rgb(28_27_25_/_17%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#496699] focus-visible:ring-offset-2"
            to="/signup"
            onClick={closeMenu}
          >
            Get started
          </Link>
        </nav>
      )}
    </header>
  );
}
