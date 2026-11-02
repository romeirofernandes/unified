import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartLineData01Icon,
  Message01Icon,
  SlidersHorizontalIcon,
} from "@hugeicons/core-free-icons";

const capabilities = [
  {
    number: "01",
    icon: Message01Icon,
    title: "Ask at the right moment",
    description: "Put a feedback form inside your React product, close to the task or moment customers want to talk about.",
  },
  {
    number: "02",
    icon: SlidersHorizontalIcon,
    title: "Shape a useful response",
    description: "Choose the fields that fit your question, from a quick note to a more structured conversation.",
  },
  {
    number: "03",
    icon: ChartLineData01Icon,
    title: "See what keeps coming up",
    description: "Bring related responses together and use AI summaries to spot themes worth acting on.",
  },
];

export default function Features() {
  return (
    <section id="capabilities" className="w-full bg-[#eeede7] px-5 py-16 text-[#24231f] transition-colors duration-700 sm:px-8 sm:py-20 lg:px-12 dark:bg-[#292724] dark:text-[#f4f1e9] motion-reduce:transition-none" aria-labelledby="capabilities-title">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.8fr)] md:items-end md:gap-12">
          <h2 id="capabilities-title" className="max-w-[720px] font-serif text-[clamp(2.1rem,4.4vw,3.8rem)] font-normal leading-[1.08] tracking-[-0.025em] text-balance">
            A clearer path from question to action.
          </h2>
          <p className="max-w-[520px] pb-1 text-[14px] leading-[1.65] text-[#5f5c55] sm:text-[15px] dark:text-[#c6c2b9]">
            Unified gives customer feedback a home your team can return to, understand, and use to make better product decisions.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 border-y border-[#d4d1c8] sm:mt-12 md:grid-cols-3 dark:border-[#494740]">
          {capabilities.map(({ number, icon, title, description }, index) => (
            <article className={`grid min-h-[210px] grid-cols-[40px_minmax(0,1fr)] gap-x-3.5 py-5 sm:min-h-[240px] sm:gap-x-4 sm:py-7 md:grid-cols-1 md:gap-y-6 md:px-6 lg:px-8 ${index === 0 ? "md:pl-0" : ""} ${index < capabilities.length - 1 ? "border-b border-[#d4d1c8] md:border-b-0 md:border-r dark:border-[#494740]" : ""}`} key={number}>
              <span className="row-span-2 grid size-10 place-items-center rounded-[13px] border border-[#c8d2e7] bg-[#e4e9f3] text-[#4b679f] dark:border-[#52617c] dark:bg-[#343f53] dark:text-[#cbd8f1]">
                <HugeiconsIcon icon={icon} size={19} aria-hidden="true" />
              </span>
              <span className="self-center text-[12px] font-medium tabular-nums tracking-[0.04em] text-[#858178] md:order-first dark:text-[#aaa69e]">{number}</span>
              <div className="col-start-2 row-start-2 md:col-auto md:row-auto">
                <h3 className="font-serif text-[21px] leading-[1.2] tracking-[-0.02em] sm:text-[22px]">{title}</h3>
                <p className="mt-3 max-w-[370px] text-[13px] leading-[1.65] text-[#65625b] sm:text-[14px] dark:text-[#c6c2b9]">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
