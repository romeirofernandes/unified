import MergeFigure from "./MergeFigure";

export default function Testimonials() {
  return (
    <section id="how-it-works" className="w-full overflow-x-clip bg-[#24231f] px-5 py-16 text-[#f4f3ee] transition-colors duration-700 sm:px-8 sm:py-20 lg:px-12 dark:bg-[#171716] dark:text-[#f4f1e9] motion-reduce:transition-none" aria-labelledby="process-title">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-8 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)] lg:gap-12">
        <div className="max-w-[470px]">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium tracking-[0.04em] text-[#d6d3ca]">
            <span className="size-2 rounded-full bg-[#91a9d9]" aria-hidden="true" />
            Feedback, in good hands
          </p>
          <h2 id="process-title" className="font-serif text-[clamp(2.1rem,4vw,3.6rem)] font-normal leading-[1.08] tracking-[-0.025em] text-balance">
            From a first note to a better next step.
          </h2>
          <p className="mt-4 max-w-[430px] text-[14px] leading-[1.7] text-[#c2bfb7] sm:text-[15px]">
            Responses arrive in one place. Patterns become easier to see, and the people making the product can decide what deserves attention.
          </p>
          <ol className="mt-6 grid gap-3 border-t border-white/15 pt-5 pl-0">
            {[
              "Invite a customer to share what they need.",
              "Group the responses around a real theme.",
              "Use the signal to choose what comes next.",
            ].map((step, index) => (
              <li className="grid list-none grid-cols-[26px_minmax(0,1fr)] items-start gap-2.5 text-[13px] leading-[1.5] text-[#e3e0d9] sm:text-[14px]" key={step}>
                <span className="grid size-6 place-items-center rounded-full border border-white/20 text-[10px] tabular-nums text-[#c3d1ed]">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <div className="min-w-0">
          <MergeFigure />
        </div>
      </div>
    </section>
  );
}
