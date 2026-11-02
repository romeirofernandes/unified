import { BarChartSquare02, MessageSquare01, Sliders03 } from "@untitledui/icons";

const features = [
  {
    icon: MessageSquare01,
    title: "Ask in context",
    description: "Place a feedback form in your React app, right where a thought or friction point happens.",
    className: "landing-feature landing-feature--lead",
  },
  {
    icon: Sliders03,
    title: "Shape the questions",
    description: "Choose the fields that fit your product, from a quick note to a structured response.",
    className: "landing-feature landing-feature--form",
  },
  {
    icon: BarChartSquare02,
    title: "Find the signal",
    description: "Review responses together and generate AI summaries to spot recurring themes.",
    className: "landing-feature landing-feature--insight",
  },
];

export default function Features() {
  return (
    <section id="features" className="landing-features" aria-labelledby="features-title">
      <div className="landing-section-heading">
        <h2 id="features-title">Useful feedback starts with a better way to listen.</h2>
        <p>Collect the details, see what repeats, and keep your next step close to the customer’s words.</p>
      </div>

      <div className="landing-feature-grid">
        {features.map(({ icon: Icon, title, description, className }) => (
          <article key={title} className={className}>
            <span className="landing-feature__icon"><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></span>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
