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
    <section id="testimonials" className="relative -mx-5 grid grid-cols-1 gap-8 overflow-hidden bg-[#1c1b19] px-5 py-16 text-[#f4f3ee] sm:-mx-8 sm:gap-14 sm:px-8 sm:py-24 lg:grid-cols-[minmax(230px,0.8fr)_minmax(0,1.6fr)]" aria-labelledby="process-title">
      <div>
        <p className="mb-5 flex items-center gap-3 text-xs font-medium tracking-wide text-[#c0bdb5] sm:mb-6 sm:text-[13px]">
          <span className="h-px w-7 bg-[#7c99d7]" aria-hidden="true" />
          How it works
        </p>
        <h2 id="process-title" className="max-w-[400px] font-serif text-[clamp(2rem,4vw,2.75rem)] font-normal leading-tight tracking-[-0.055em]">From a customer’s thought to your next release.</h2>
      </div>
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-3 sm:gap-5">
        {steps.map(({ icon: Icon, title, body }, index) => (
          <article key={title} className={`grid min-h-0 grid-cols-[42px_1fr] items-start gap-x-4 border-t border-[#45433e] py-5 sm:block sm:min-h-[196px] sm:border-0 sm:py-0 ${index === steps.length - 1 ? "border-b sm:border-b-0" : ""}`}>
            <span className="row-span-2 grid size-[42px] place-items-center rounded-[13px] border border-[#7c99d7]/40 bg-[#292a2b] text-[#b5c8f0]"><HugeiconsIcon icon={Icon} size={19} strokeWidth={1.7} aria-hidden="true" /></span>
            <h3 className="font-serif text-base font-normal tracking-tight text-[#f4f3ee] sm:mt-5">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#b7b4ad] sm:mt-2">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
