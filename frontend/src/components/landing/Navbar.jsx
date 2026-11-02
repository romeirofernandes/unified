import { useState } from "react";
import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon, Message01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#testimonials" },
  { label: "Documentation", href: "/docs" },
];

export default function Navbar({ onGetStarted }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="landing-header">
      <div className="landing-container landing-header__inner">
        <Link className="landing-brand" to="/" aria-label="Unified home">
          <span className="landing-brand__mark" aria-hidden="true"><HugeiconsIcon icon={Message01Icon} size={18} /></span>
          <span>unified</span>
        </Link>

        <nav className="landing-nav" aria-label="Main navigation">
          {links.map((link) => (
            link.href.startsWith("/") ? (
              <Link key={link.label} className="landing-nav__link" to={link.href}>{link.label}</Link>
            ) : (
              <a key={link.label} className="landing-nav__link" href={link.href}>{link.label}</a>
            )
          ))}
        </nav>

        <div className="landing-header__actions">
          <Link className="landing-signin" to="/login">Sign in</Link>
          <Button variant="secondary" className="landing-button landing-button--primary landing-button--small" onClick={onGetStarted}>
            <HugeiconsIcon icon={Message01Icon} size={16} aria-hidden="true" /> Get started
          </Button>
        </div>

        <button
          className="landing-menu-toggle"
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
        <nav id="landing-mobile-nav" className="landing-mobile-nav" aria-label="Mobile navigation">
          {links.map((link) => (
            link.href.startsWith("/") ? (
              <Link key={link.label} to={link.href} onClick={closeMenu}>{link.label}</Link>
            ) : (
              <a key={link.label} href={link.href} onClick={closeMenu}>{link.label}</a>
            )
          ))}
          <Link to="/login" onClick={closeMenu}>Sign in</Link>
          <Button
            variant="secondary"
            className="landing-button landing-button--primary"
            onClick={() => {
              closeMenu();
              onGetStarted();
            }}
          >
            Get started
          </Button>
        </nav>
      )}
    </header>
  );
}
