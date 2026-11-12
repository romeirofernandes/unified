import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { tactileButtonBase, tactilePrimaryButton } from "./buttonStyles";

export default function CTA() {
  const { user } = useAuth();
  return (
    <section className="w-full bg-[#f4f3ee] px-5 py-24 text-[#24231f] transition-colors duration-700 sm:px-8 sm:py-28 lg:px-12 lg:py-32 dark:bg-[#141413] dark:text-[#f4f1e9] motion-reduce:transition-none" aria-labelledby="landing-cta-title">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
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
            className={`${tactileButtonBase} ${tactilePrimaryButton} h-10 px-5 text-[14px] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f3ee] dark:focus-visible:ring-offset-[#141413]`}
            to={user ? "/dashboard" : "/signup"}
          >
            Create your project <HugeiconsIcon icon={ArrowRight01Icon} size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
