import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CheckIcon, Message01Icon } from "@hugeicons/core-free-icons";
import { Link } from "react-router-dom";

const integrationCode = `import { UnifiedFeedback } from "unified-sdk";
import "unified-sdk/dist/unified-sdk.css";

<UnifiedFeedback
  projectId={projectId}
  firebaseUid={firebaseUid}
  theme="light"
/>`;

export default function Hero({ onGetStarted }) {
  return (
    <section className="grid min-h-[600px] grid-cols-1 justify-items-center content-center py-16 text-center sm:min-h-[640px] sm:py-24" aria-labelledby="landing-title">
      <div className="w-full max-w-[800px]">
        <p className="mb-5 flex items-center justify-center gap-3 text-[12px] font-medium tracking-wide text-[#625f59] sm:mb-6 sm:text-[13px] dark:text-[#c0bdb5]">
          <span className="h-px w-7 bg-[#7c99d7]" aria-hidden="true" />
          A feedback loop for thoughtful teams
        </p>
        <h1 id="landing-title" className="font-serif text-[clamp(2.75rem,8vw,5.5rem)] font-normal leading-[0.98] tracking-[-0.065em] text-[#1c1b19] dark:text-[#f2f0ea]">Make feedback part of how you build.</h1>
        <p className="mx-auto mt-5 max-w-[630px] text-[15px] leading-relaxed text-[#625f59] sm:mt-6 sm:text-[17px] dark:text-[#c0bdb5]">
          Give customers a clear way to speak up, then turn their responses into product decisions.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:mt-8 sm:gap-6">
          <button
            type="button"
            className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border-2 border-[#4f6da9] bg-gradient-to-b from-[#87a2dd] to-[#6684c4] px-4 text-sm font-semibold text-white shadow-[0_1px_0_#405785,0_3px_7px_rgb(28_27_25_/_19%)] transition hover:-translate-y-px hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c99d7] focus-visible:ring-offset-2 sm:px-5"
            onClick={onGetStarted}
          >
            <HugeiconsIcon icon={Message01Icon} size={18} aria-hidden="true" />
            Start collecting feedback
            <HugeiconsIcon icon={ArrowRight01Icon} size={17} aria-hidden="true" />
          </button>
          <Link className="inline-flex items-center gap-2 text-sm font-medium text-[#1c1b19] no-underline hover:text-[#4f6da9] dark:text-[#f2f0ea]" to="/docs">
            Read the documentation <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-[#817e76] sm:mt-10 sm:gap-5 sm:text-xs" aria-label="Product details">
          <span className="inline-flex items-center gap-1.5"><HugeiconsIcon icon={CheckIcon} size={15} className="text-[#4f6da9]" aria-hidden="true" /> Made for React</span>
          <span className="inline-flex items-center gap-1.5"><HugeiconsIcon icon={CheckIcon} size={15} className="text-[#4f6da9]" aria-hidden="true" /> Custom forms</span>
          <span className="inline-flex items-center gap-1.5"><HugeiconsIcon icon={CheckIcon} size={15} className="text-[#4f6da9]" aria-hidden="true" /> AI summaries</span>
        </div>
      </div>

      <aside className="mt-10 w-full max-w-[740px] rounded-2xl border border-[#d8d5ce] bg-white p-4 text-left shadow-[inset_0_1px_0_rgb(255_255_255_/_90%),0_2px_0_rgb(28_27_25_/_4%),0_22px_48px_rgb(28_27_25_/_8%)] sm:mt-14 sm:rounded-[18px] sm:p-7 dark:border-[#45433e] dark:bg-[#2a2926] dark:shadow-[0_22px_48px_rgb(0_0_0_/_18%)]" aria-label="Example Unified integration">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="mb-2 block text-xs text-[#817e76]">A small addition</span>
            <h2 className="font-serif text-xl font-normal tracking-tight text-[#1c1b19] sm:text-[23px] dark:text-[#f2f0ea]">One component. A clearer signal.</h2>
          </div>
          <span className="rounded-md border border-[#d8d5ce] bg-[#f8f7f3] px-2 py-1 text-[11px] text-[#625f59] dark:border-[#45433e] dark:bg-[#252421] dark:text-[#c0bdb5]">React</span>
        </div>
        <pre className="my-5 overflow-x-auto rounded-xl border border-[#d8d5ce]/70 bg-[#f5f4f0] p-3 font-mono text-[10px] leading-7 text-[#354034] sm:my-6 sm:p-5 sm:text-[13px] dark:border-[#45433e] dark:bg-[#222936] dark:text-[#d3ddf3]"><code>{integrationCode}</code></pre>
        <div className="flex items-center justify-between gap-3 text-[11px] leading-relaxed text-[#625f59] sm:text-xs dark:text-[#c0bdb5]">
          <span>Install the SDK, add your project ID, and you’re ready.</span>
          <Link className="grid size-[34px] shrink-0 place-items-center rounded-lg border border-[#d8d5ce] bg-[#f8f7f3] text-[#4f6da9] no-underline dark:border-[#45433e] dark:bg-[#252421]" to="/docs" aria-label="Read integration documentation">
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
          </Link>
        </div>
      </aside>
    </section>
  );
}
