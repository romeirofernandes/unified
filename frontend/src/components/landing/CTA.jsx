import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export default function CTA({ onGetStarted }) {
  return (
    <section className="relative mb-16 flex flex-col items-start justify-between gap-7 bg-[#7c99d7] px-6 py-8 text-white sm:mb-24 sm:flex-row sm:items-end sm:gap-12 sm:px-12 sm:py-14" aria-labelledby="landing-cta-title">
      <div className="max-w-[610px]">
        <h2 id="landing-cta-title" className="font-serif text-[clamp(2rem,4vw,2.75rem)] font-normal leading-tight tracking-[-0.055em]">Make space for the feedback that moves you forward.</h2>
      </div>
      <div className="w-full shrink-0 sm:w-auto sm:max-w-[245px]">
        <button
          type="button"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border-2 border-[#405785] bg-gradient-to-b from-[#87a2dd] to-[#6684c4] px-5 text-sm font-semibold text-white shadow-[0_1px_0_#405785,0_3px_7px_rgb(28_27_25_/_19%)] transition hover:-translate-y-px hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c99d7] focus-visible:ring-offset-2 sm:w-auto"
          onClick={onGetStarted}
        >
          Create your project <HugeiconsIcon icon={ArrowRight01Icon} size={17} aria-hidden="true" />
        </button>
        <p className="mt-3 text-xs leading-relaxed text-white/80">Set up a project and add Unified to your React app.</p>
      </div>
    </section>
  );
}
