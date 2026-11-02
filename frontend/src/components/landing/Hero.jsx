import { ArrowRight, Check } from "@untitledui/icons";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const integrationCode = `import { UnifiedFeedback } from "unified-sdk";
import "unified-sdk/dist/unified-sdk.css";

<UnifiedFeedback
  projectId={projectId}
  firebaseUid={firebaseUid}
  theme="light"
/>`;

export default function Hero({ onGetStarted }) {
  return (
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero__copy">
        <p className="landing-eyebrow">
          <span className="landing-eyebrow__rule" aria-hidden="true" />
          A feedback loop for thoughtful teams
        </p>
        <h1 id="landing-title">Make feedback part of how you build.</h1>
        <p className="landing-hero__lede">
          Give customers a clear way to speak up, then turn their responses into product decisions.
        </p>
        <div className="landing-hero__actions">
          <Button
            variant="secondary"
            trailingIcon={ArrowRight}
            className="landing-button landing-button--primary"
            onClick={onGetStarted}
          >
            Start collecting feedback
          </Button>
          <Link className="landing-text-link" to="/docs">
            Read the documentation <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="landing-hero__assurances" aria-label="Product details">
          <span><Check size={15} aria-hidden="true" /> Made for React</span>
          <span><Check size={15} aria-hidden="true" /> Custom forms</span>
          <span><Check size={15} aria-hidden="true" /> AI summaries</span>
        </div>
      </div>

      <aside className="landing-code-card" aria-label="Example Unified integration">
        <div className="landing-code-card__topline">
          <div>
            <span className="landing-code-card__kicker">A small addition</span>
            <h2>One component. A clearer signal.</h2>
          </div>
          <span className="landing-code-card__language">React</span>
        </div>
        <pre className="landing-code"><code>{integrationCode}</code></pre>
        <div className="landing-code-card__footer">
          <span>Install the SDK, add your project ID, and you’re ready.</span>
          <Link to="/docs" aria-label="Read integration documentation">
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </aside>
    </section>
  );
}
