import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/ui/button";

export default function CTA({ onGetStarted }) {
  return (
    <section className="landing-cta" aria-labelledby="landing-cta-title">
      <div className="landing-cta__copy">
        <h2 id="landing-cta-title">Make space for the feedback that moves you forward.</h2>
      </div>
      <div className="landing-cta__action">
        <Button
          variant="secondary"
          trailingIcon={ArrowRight}
          className="landing-button landing-button--primary"
          onClick={onGetStarted}
        >
          Create your project
        </Button>
        <p>Set up a project and add Unified to your React app.</p>
      </div>
    </section>
  );
}
