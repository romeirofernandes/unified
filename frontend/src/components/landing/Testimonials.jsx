export default function Testimonials() {
  return (
    <section id="how-it-works" className="w-full overflow-x-clip bg-[#24231f] px-5 py-16 text-[#f4f3ee] transition-colors duration-700 sm:px-8 sm:py-20 lg:px-12 dark:bg-[#171716] dark:text-[#f4f1e9] motion-reduce:transition-none" aria-labelledby="process-title">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div className="max-w-[470px]">
          <h2 id="process-title" className="font-serif text-[clamp(2.1rem,4vw,3.6rem)] font-normal leading-[1.08] tracking-[-0.025em] text-balance">
            From a first note to a better next step.
          </h2>
          <p className="mt-4 max-w-[430px] text-[14px] leading-[1.7] text-[#c2bfb7] sm:text-[15px]">
            Responses arrive in one place. Patterns become easier to see, and the people making the product can decide what deserves attention.
          </p>
        </div>
        <ol className="grid w-full gap-0 border-y border-white/15 p-0">
          {[
            "Invite a customer to share what they need.",
            "Group the responses around a real theme.",
            "Use the signal to choose what comes next.",
          ].map((step, index) => (
            <li className={`grid list-none grid-cols-[minmax(0,1fr)_36px] items-center gap-4 py-5 text-[14px] leading-[1.5] text-[#e3e0d9] sm:py-6 sm:text-[15px] ${index < 2 ? "border-b border-white/15" : ""}`} key={step}>
              <span>{step}</span>
              <span className="text-right font-mono text-[12px] tabular-nums tracking-[0.04em] text-[#a9bbdf]">{index + 1}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
