import { HugeiconsIcon } from "@hugeicons/react";
import { BarChartIcon, Message01Icon, SlidersHorizontalIcon } from "@hugeicons/core-free-icons";

const features = [
  {
    icon: Message01Icon,
    title: "Ask in context",
    description: "Place a feedback form in your React app, right where a thought or friction point happens.",
  },
  {
    icon: SlidersHorizontalIcon,
    title: "Shape the questions",
    description: "Choose the fields that fit your product, from a quick note to a structured response.",
  },
  {
    icon: BarChartIcon,
    title: "Find the signal",
    description: "Review responses together and generate AI summaries to spot recurring themes.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-14 sm:py-20" aria-labelledby="features-title">
      <div className="mb-8 h-1.5 w-full bg-[repeating-linear-gradient(90deg,#d8d5ce_0_5px,transparent_5px_10px)] opacity-70 sm:mb-11" aria-hidden="true" />
      <div className="mx-auto mb-8 max-w-[720px] text-center sm:mb-12">
        <h2 id="features-title" className="font-serif text-[clamp(2rem,5vw,3.125rem)] font-normal leading-tight tracking-[-0.055em] text-[#1c1b19] dark:text-[#f2f0ea]">Useful feedback starts with a better way to listen.</h2>
        <p className="mx-auto mt-4 max-w-[570px] text-sm leading-7 text-[#625f59] sm:text-[15px] dark:text-[#c0bdb5]">Collect the details, see what repeats, and keep your next step close to the customer’s words.</p>
      </div>

      <div className="grid grid-cols-1 border-y border-[#d8d5ce] sm:grid-cols-3 dark:border-[#45433e]">
        {features.map(({ icon: Icon, title, description }, index) => (
          <article key={title} className={`flex min-h-[190px] flex-col gap-6 px-2 py-6 sm:min-h-[220px] sm:gap-8 sm:px-7 sm:py-7 ${index < features.length - 1 ? "border-b border-[#d8d5ce] sm:border-b-0 sm:border-r dark:border-[#45433e]" : ""}`}>
            <span className="grid size-[42px] shrink-0 place-items-center rounded-[13px] border border-[#7c99d7]/40 bg-gradient-to-br from-white to-[#e5ebf7] text-[#4f6da9] shadow-[inset_0_1px_0_rgb(255_255_255_/_80%)] dark:from-[#2a2926] dark:to-[#303b50] dark:text-[#b5c8f0]"><HugeiconsIcon icon={Icon} size={21} strokeWidth={1.7} aria-hidden="true" /></span>
            <div>
              <h3 className="font-serif text-xl font-normal tracking-tight text-[#1c1b19] dark:text-[#f2f0ea]">{title}</h3>
              <p className="mt-2 max-w-[430px] text-sm leading-relaxed text-[#625f59] dark:text-[#c0bdb5]">{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
