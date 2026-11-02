import { HugeiconsIcon } from "@hugeicons/react";
import { Message01Icon } from "@hugeicons/core-free-icons";

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-container landing-footer__inner">
        <a className="landing-brand" href="/" aria-label="Unified home">
          <span className="landing-brand__mark" aria-hidden="true"><HugeiconsIcon icon={Message01Icon} size={18} /></span>
          <span>unified</span>
        </a>
        <p>Feedback that helps you build with more context.</p>
        <nav aria-label="Footer navigation">
          <a href="/docs">Documentation</a>
          <a href="https://github.com/romeirofernandes" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <span className="landing-footer__copyright">© {new Date().getFullYear()} Unified</span>
        <p className="landing-footer__credit">crafted by <a href="https://romeiro.dev">romeiro's</a> agents</p>
      </div>
    </footer>
  );
}
