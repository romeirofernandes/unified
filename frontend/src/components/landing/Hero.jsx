import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Link } from "react-router-dom";
import { tactileButtonBase, tactilePrimaryButton, tactileSecondaryButton } from "./buttonStyles";

export default function Hero() {
  return (
    <section className="w-full bg-transparent px-5 pb-7 pt-8 text-center text-[#24231f] transition-colors duration-700 sm:px-8 sm:pb-9 sm:pt-10 lg:px-12 lg:pt-12 dark:text-[#f4f1e9] motion-reduce:transition-none" aria-labelledby="landing-title">
      <div className="mx-auto grid w-full min-w-0 max-w-[1200px] justify-items-center">
        <h1 id="landing-title" className="w-full min-w-0 max-w-[1000px] font-serif text-[clamp(2.3rem,4.9vw,4.5rem)] font-normal leading-[1.08] tracking-[-0.025em] text-balance text-[#24231f] dark:text-[#f4f1e9]">
          <span className="sm:block">Make customer feedback</span>{" "}
          <span className="sm:block">part of your next release.</span>
        </h1>
        <p className="mx-auto mt-4 w-full min-w-0 max-w-[640px] text-[15px] leading-[1.65] text-pretty text-[#5e5b54] sm:mt-5 sm:text-[16px] dark:text-[#c6c2b9]">
          Collect useful feedback inside your React app, see what customers keep asking for, and decide what to build next.
        </p>
        <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-6 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <Link
            className={`${tactileButtonBase} ${tactilePrimaryButton} min-h-[46px] px-5 text-[14px] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f3ee] dark:focus-visible:ring-offset-[#211f1d]`}
            to="/signup"
          >
            Create your project <HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
          </Link>
          <Link className={`${tactileButtonBase} ${tactileSecondaryButton} min-h-[46px] px-5 text-[14px] no-underline`} to="/docs">
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
      </div>
    </section>
  );
}
