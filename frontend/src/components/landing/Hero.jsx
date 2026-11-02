import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowRight01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="w-full bg-[#f4f3ee] px-5 pb-10 pt-12 text-center text-[#24231f] transition-colors duration-700 sm:px-8 sm:pb-14 sm:pt-16 lg:px-12 lg:pt-20 dark:bg-[#211f1d] dark:text-[#f4f1e9] motion-reduce:transition-none" aria-labelledby="landing-title">
      <div className="mx-auto grid w-full min-w-0 max-w-[1200px] justify-items-center">
        <p className="mb-6 inline-flex min-h-9 max-w-full items-center justify-center gap-2 rounded-full border border-[#d6d3ca] bg-white/70 px-3.5 py-2 text-center text-[12px] font-medium tracking-[0.015em] text-[#56534d] shadow-[0_2px_8px_rgb(28_27_25_/_4%)] dark:border-[#45433e] dark:bg-white/5 dark:text-[#d0ccc3]">
          <span className="size-2 rounded-full bg-[#7c99d7]" aria-hidden="true" />
          Feedback that makes the next release clearer
        </p>
        <h1 id="landing-title" className="w-full min-w-0 max-w-[1000px] font-serif text-[clamp(2.3rem,4.9vw,4.5rem)] font-normal leading-[1.08] tracking-[-0.025em] text-balance text-[#24231f] dark:text-[#f4f1e9]">
          <span className="sm:block">Make customer feedback</span>{" "}
          <span className="sm:block">part of your next release.</span>
        </h1>
        <p className="mx-auto mt-5 w-full min-w-0 max-w-[640px] text-[15px] leading-[1.65] text-pretty text-[#5e5b54] sm:mt-6 sm:text-[16px] dark:text-[#c6c2b9]">
          Collect useful feedback inside your React app, see what customers keep asking for, and decide what to build next.
        </p>
        <div className="mt-7 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <Link
            className="inline-flex min-h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border-2 border-[#30456d] bg-gradient-to-b from-[#5575b4] to-[#405783] px-5 text-[14px] font-semibold text-white shadow-[0_1px_0_#26385b,0_4px_9px_rgb(28_27_25_/_18%)] transition-[filter,transform,box-shadow] duration-200 hover:-translate-y-px hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#405783] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f3ee] active:translate-y-0 active:shadow-[0_1px_0_#26385b] dark:focus-visible:ring-offset-[#211f1d]"
            to="/signup"
          >
            Create your project <HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
          </Link>
          <Link className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] border border-[#d4d1c8] bg-white/60 px-5 text-[14px] font-medium text-[#383631] no-underline shadow-[0_2px_4px_rgb(28_27_25_/_5%)] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#405783] focus-visible:ring-offset-2 dark:border-[#4a4842] dark:bg-white/5 dark:text-[#f4f1e9] dark:hover:bg-white/10" to="/docs">
            Read the documentation
          </Link>
        </div>
        <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 p-0 text-[12px] text-[#716e67] dark:text-[#aaa69e]">
          {["Built for React", "Custom feedback forms", "AI summaries"].map((item) => (
            <li className="inline-flex list-none items-center gap-2" key={item}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-[#5575b4] dark:text-[#9bb3e3]" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <a className="mt-8 grid size-10 place-items-center rounded-full text-[#6a675f] no-underline transition-colors hover:bg-black/5 hover:text-[#24231f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#405783] dark:text-[#c6c2b9] dark:hover:bg-white/5 dark:hover:text-white" href="#product" aria-label="Explore the Unified product preview">
          <HugeiconsIcon icon={ArrowDown01Icon} size={20} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
