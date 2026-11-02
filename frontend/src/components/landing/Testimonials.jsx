import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, CheckmarkCircle01Icon, CodeIcon } from "@hugeicons/core-free-icons";

const steps = [
  {
    icon: CodeIcon,
    title: "Add the widget",
    body: "Install the React SDK and connect it to your project.",
  },
  {
    icon: CheckmarkCircle01Icon,
    title: "Collect what matters",
    body: "Create the feedback form your customers need to answer.",
  },
  {
    icon: ArrowUpRight01Icon,
    title: "Choose what to improve",
    body: "Review the responses, use a summary to find themes, and decide what to do next.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="landing-process" aria-labelledby="process-title">
      <div className="landing-process__intro">
        <p className="landing-eyebrow">
          <span className="landing-eyebrow__rule" aria-hidden="true" />
          How it works
        </p>
        <h2 id="process-title">From a customer’s thought to your next release.</h2>
      </div>
      <div className="landing-process__steps">
        {steps.map(({ icon: Icon, title, body }) => (
          <article key={title} className="landing-process-step">
            <span className="landing-process-step__icon"><HugeiconsIcon icon={Icon} size={19} strokeWidth={1.7} aria-hidden="true" /></span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
