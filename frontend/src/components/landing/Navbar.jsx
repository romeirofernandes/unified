import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu01, XClose } from "@untitledui/icons";
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
          <span className="landing-brand__mark" aria-hidden="true">u</span>
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
          <Button
            variant="secondary"
            className="landing-button landing-button--primary landing-button--small"
            onClick={onGetStarted}
          >
            Get started
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
          {menuOpen ? <XClose size={20} /> : <Menu01 size={20} />}
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
