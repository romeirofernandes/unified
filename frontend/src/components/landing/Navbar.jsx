import { useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon, Message01Icon } from "@hugeicons/core-free-icons";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#testimonials" },
  { label: "Documentation", href: "/docs" },
];

export default function Navbar({ onGetStarted }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-20 border-b border-[#d8d5ce]/80 bg-[#f4f3ee]/95 backdrop-blur dark:border-[#45433e] dark:bg-[#201f1d]/95">
      <div className="mx-auto grid min-h-[68px] w-full max-w-[1160px] grid-cols-[1fr_auto] items-center gap-4 px-5 sm:min-h-[78px] sm:grid-cols-[1fr_auto_1fr] sm:px-8">
        <Link className="inline-flex w-fit items-center gap-2.5 font-serif text-[22px] tracking-[-0.055em] text-inherit no-underline sm:text-2xl" to="/" aria-label="Unified home">
          <span className="grid size-[30px] place-items-center rounded-[10px] border border-[#7c99d7]/60 bg-gradient-to-br from-white to-[#e5ebf7] text-[#4f6da9] shadow-[inset_0_1px_0_rgb(255_255_255_/_70%),0_1px_1px_rgb(28_27_25_/_8%)] dark:from-[#2a2926] dark:to-[#303b50] dark:text-[#dce5fb]" aria-hidden="true"><HugeiconsIcon icon={Message01Icon} size={18} /></span>
          <span>unified</span>
        </Link>

        <nav className="hidden items-center gap-7 sm:flex" aria-label="Main navigation">
          {links.map((link) => (
            link.href.startsWith("/") ? (
              <Link key={link.label} className="text-[13px] text-[#625f59] no-underline transition-colors hover:text-[#1c1b19] dark:text-[#c0bdb5] dark:hover:text-white" to={link.href}>{link.label}</Link>
            ) : (
              <a key={link.label} className="text-[13px] text-[#625f59] no-underline transition-colors hover:text-[#1c1b19] dark:text-[#c0bdb5] dark:hover:text-white" href={link.href}>{link.label}</a>
            )
          ))}
        </nav>

        <div className="hidden items-center justify-end gap-5 sm:flex">
          <Link className="text-[13px] text-[#625f59] no-underline dark:text-[#c0bdb5]" to="/login">Sign in</Link>
          <button type="button" className="inline-flex min-h-[42px] items-center gap-2 whitespace-nowrap rounded-xl border-2 border-[#4f6da9] bg-gradient-to-b from-[#87a2dd] to-[#6684c4] px-4 text-sm font-semibold text-white shadow-[0_1px_0_#405785,0_3px_7px_rgb(28_27_25_/_19%)] transition hover:-translate-y-px hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c99d7] focus-visible:ring-offset-2" onClick={onGetStarted}>
            <HugeiconsIcon icon={Message01Icon} size={16} aria-hidden="true" /> Get started
          </button>
        </div>

        <button
          className="grid size-10 place-items-center justify-self-end rounded-xl border border-[#d8d5ce] bg-white text-[#1c1b19] sm:hidden dark:border-[#45433e] dark:bg-[#2a2926] dark:text-white"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={20} aria-hidden="true" />
        </button>
      </div>

      {menuOpen && (
        <nav id="landing-mobile-nav" className="absolute inset-x-0 top-full grid gap-1 border-b border-[#d8d5ce] bg-[#f4f3ee] px-5 py-4 shadow-lg sm:hidden dark:border-[#45433e] dark:bg-[#201f1d]" aria-label="Mobile navigation">
          {links.map((link) => (
            link.href.startsWith("/") ? (
              <Link key={link.label} className="rounded-lg px-3 py-2.5 text-sm text-inherit no-underline hover:bg-black/5 dark:hover:bg-white/5" to={link.href} onClick={closeMenu}>{link.label}</Link>
            ) : (
              <a key={link.label} className="rounded-lg px-3 py-2.5 text-sm text-inherit no-underline hover:bg-black/5 dark:hover:bg-white/5" href={link.href} onClick={closeMenu}>{link.label}</a>
            )
          ))}
          <Link className="rounded-lg px-3 py-2.5 text-sm text-inherit no-underline hover:bg-black/5 dark:hover:bg-white/5" to="/login" onClick={closeMenu}>Sign in</Link>
          <button
            type="button"
            className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border-2 border-[#4f6da9] bg-gradient-to-b from-[#87a2dd] to-[#6684c4] px-5 text-sm font-semibold text-white shadow-[0_1px_0_#405785,0_3px_7px_rgb(28_27_25_/_19%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c99d7] focus-visible:ring-offset-2"
            onClick={() => {
              closeMenu();
              onGetStarted();
            }}
          >
            Get started
          </button>
        </nav>
      )}
    </header>
  );
}
