export default function HeroBackground({ children }) {
  return (
    <section className="relative isolate w-full overflow-hidden bg-[#f4f3ee] text-[#24231f] transition-colors duration-700 dark:bg-[#141413] dark:text-[#f4f1e9] motion-reduce:transition-none">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex h-[320px] flex-col sm:h-[380px] lg:h-[440px]">
        <div className="flex-1 bg-[conic-gradient(#7c99d7_25%,transparent_0_50%,#7c99d7_0_75%,transparent_0)] [background-size:16px_16px] [image-rendering:pixelated]" />
        <div className="flex-1 bg-[#dfe6f5] dark:bg-[#36445f]" />
        <div className="flex-1 bg-[#b9c9e8] dark:bg-[#425479]" />
        <div className="flex-1 bg-[#9bb3e3] dark:bg-[#4e6390]" />
        <div className="flex-1 bg-[#7c99d7] dark:bg-[#5b74ab]" />
        <div className="flex-1 bg-[#5575b4] dark:bg-[#405783]" />
        <div className="[flex:1.3_1_0%] bg-[#405783] dark:bg-[#354972]" />
      </div>
      <div className="relative z-10">{children}</div>
    </section>
  );
}
