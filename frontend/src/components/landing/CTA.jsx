import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="w-full bg-[#e4e9f2] px-5 py-14 text-[#24231f] transition-colors duration-700 sm:px-8 sm:py-18 lg:px-12 dark:bg-[#30394b] dark:text-[#f4f1e9] motion-reduce:transition-none" aria-labelledby="landing-cta-title">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
        <div className="max-w-[760px]">
          <p className="mb-4 text-[13px] font-medium tracking-[0.05em] text-[#526b9d] dark:text-[#c5d3f1]">Bring the customer voice closer</p>
          <h2 id="landing-cta-title" className="font-serif text-[clamp(2.1rem,4.2vw,3.8rem)] font-normal leading-[1.08] tracking-[-0.025em] text-balance">
            Build the thing your customers keep asking for.
          </h2>
          <p className="mt-4 max-w-[620px] text-[14px] leading-[1.65] text-[#5c5a55] sm:text-[15px] dark:text-[#d3d8e4]">
            Start collecting product feedback with a small addition to your React app.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <Link
            className="inline-flex min-h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border-2 border-[#30456d] bg-gradient-to-b from-[#5575b4] to-[#405783] px-5 text-[14px] font-normal text-white shadow-[0_1px_0_#26385b,0_4px_9px_rgb(28_27_25_/_17%)] transition-[filter,transform,box-shadow] duration-200 hover:-translate-y-px hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#354972] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4e9f2] active:translate-y-0 active:shadow-[0_1px_0_#26385b] dark:focus-visible:ring-offset-[#30394b]"
            to="/signup"
          >
            Create your project <HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
          </Link>
          <Link className="text-[13px] text-[#4d4a44] underline decoration-[#9ba8c2] underline-offset-4 hover:text-[#202c44] dark:text-[#e2e6ef] dark:hover:text-white" to="/docs">Read the setup guide</Link>
        </div>
      </div>
    </section>
  );
}
