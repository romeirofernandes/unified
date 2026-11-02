import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  Comment01Icon,
  FilterIcon,
  Home01Icon,
  Search01Icon,
  Settings01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

const responses = [
  { initials: "AM", name: "Ava Mitchell", time: "12 min ago", title: "Let me save a draft before sending", tag: "Workflow", color: "bg-[#e9edf6] text-[#45649d]", body: "I often need to step away before a report is ready. A draft would help me pick up where I left off." },
  { initials: "JL", name: "Jordan Lee", time: "38 min ago", title: "Could we filter by team?", tag: "Reporting", color: "bg-[#efe9dd] text-[#7b633c]", body: "Our workspace has grown and I need a quick way to focus on one team's activity." },
];

const sidebar = [
  { icon: Home01Icon, label: "Overview" },
  { icon: Comment01Icon, label: "Feedback", active: true },
  { icon: SparklesIcon, label: "Insights" },
  { icon: Settings01Icon, label: "Settings" },
];

export default function ProductPreview() {
  return (
    <section id="product" className="w-full overflow-x-clip bg-[#f4f3ee] px-4 pb-16 text-[#282722] transition-colors duration-700 sm:px-8 sm:pb-20 lg:px-12 dark:bg-[#211f1d] dark:text-[#f4f1e9] motion-reduce:transition-none" aria-label="Unified product preview">
      <div className="mx-auto w-full max-w-[1200px] overflow-hidden rounded-[20px] border border-[#d6d3ca] bg-[#fbfaf7] shadow-[0_3px_0_rgb(28_27_25_/_4%),0_24px_60px_rgb(28_27_25_/_12%)] sm:rounded-[24px] dark:border-[#48463f] dark:bg-[#292724] dark:shadow-[0_30px_75px_rgb(0_0_0_/_24%)]">
        <div className="flex min-h-14 items-center justify-between gap-4 border-b border-[#e4e1d9] px-4 sm:min-h-[66px] sm:px-7 dark:border-[#45433e]">
          <div className="flex min-w-0 items-center gap-2.5 text-[13px] font-medium sm:gap-3 sm:text-sm">
            <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#e6ebf5] text-[#4f6da9] dark:bg-[#374460] dark:text-[#d8e2f9]">
              <HugeiconsIcon icon={Comment01Icon} size={17} aria-hidden="true" />
            </span>
            <span className="truncate">Unified workspace</span>
          </div>
          <span className="hidden text-[12px] text-[#817e76] sm:inline">Acme Studio</span>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg text-[#77746d] dark:text-[#c5c1b8]" aria-hidden="true">
            <HugeiconsIcon icon={Search01Icon} size={18} />
          </span>
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="hidden border-r border-[#e4e1d9] p-4 md:block lg:p-5" aria-label="Product preview navigation">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#8a877f]">Workspace</p>
            <ul className="grid gap-1 p-0">
              {sidebar.map(({ icon, label, active }) => (
                <li className="list-none" key={label}>
                  <span className={`flex min-h-10 items-center gap-2.5 rounded-[10px] px-3 text-[13px] ${active ? "bg-[#e9edf6] font-medium text-[#334c7e] dark:bg-[#374460] dark:text-[#e0e8fa]" : "text-[#66635c] dark:text-[#c5c1b8]"}`}>
                    <HugeiconsIcon icon={icon} size={17} aria-hidden="true" />{label}
                    {label === "Feedback" && <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] tabular-nums text-[#57544e] dark:bg-[#292724] dark:text-[#e0e8fa]">23</span>}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-[#e4e1d9] pt-5 dark:border-[#45433e]">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#8a877f]">Your workspace</p>
              <div className="mt-3 flex items-center gap-2 px-3 text-[12px] text-[#66635c] dark:text-[#c5c1b8]">
                <span className="grid size-7 place-items-center rounded-full bg-[#dce5f4] text-[10px] font-semibold text-[#425d91] dark:bg-[#374460] dark:text-[#dce5f4]">AS</span>
                Acme Studio
              </div>
            </div>
          </nav>

          <div className="min-w-0 p-4 sm:p-5 lg:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
              <div>
                <p className="mb-1 text-[12px] text-[#817e76]">Customer voice</p>
                <h2 className="font-serif text-[23px] leading-tight tracking-[-0.025em] sm:text-[28px]">Recent feedback</h2>
              </div>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-[11px] border border-[#d8d5ce] bg-white px-3 text-[12px] font-medium text-[#4b4943] dark:border-[#4a4842] dark:bg-[#302e2a] dark:text-[#ece9e1]">
                <HugeiconsIcon icon={FilterIcon} size={15} aria-hidden="true" /> Filter
              </span>
            </div>

            <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(220px,0.8fr)]">
              <div className="grid min-w-0 gap-3">
                {responses.map((response) => (
              <article className="min-w-0 rounded-[14px] border border-[#e2dfd7] bg-white p-3.5 sm:p-4 dark:border-[#45433e] dark:bg-[#302e2a]" key={response.title}>
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${response.color} dark:bg-[#3b3a37] dark:text-[#dce5f4]`}>{response.initials}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium">{response.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#87847c]">{response.time}</p>
                      </div>
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg text-[#817e76] dark:text-[#c5c1b8]" aria-hidden="true">
                        <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} />
                      </span>
                    </div>
                    <h3 className="font-serif text-[16px] leading-[1.25] tracking-[-0.015em] sm:text-[18px]">{response.title}</h3>
                    <p className="mt-2 line-clamp-2 text-[12px] leading-[1.55] text-[#6b6861] sm:text-[13px] dark:text-[#c5c1b8]">{response.body}</p>
                    <span className="mt-4 inline-flex rounded-full bg-[#f1f0ec] px-2.5 py-1 text-[10px] font-medium text-[#66635c] dark:bg-[#3a3834] dark:text-[#d2cec5]">{response.tag}</span>
                  </article>
                ))}
              </div>
              <aside className="flex min-w-0 flex-col justify-between rounded-[15px] border border-[#dbe1ee] bg-[#edf1f8] p-4 sm:p-5 dark:border-[#46516a] dark:bg-[#30394b]">
                <div>
                  <span className="grid size-9 place-items-center rounded-[11px] bg-white text-[#4f6da9] dark:bg-[#222936] dark:text-[#c7d5f2]">
                    <HugeiconsIcon icon={SparklesIcon} size={18} aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#596e9b] dark:text-[#bdccef]">Pattern emerging</p>
                  <h3 className="mt-2 font-serif text-[20px] leading-[1.2] tracking-[-0.02em] sm:text-[22px]">Customers want more control over their work.</h3>
                  <p className="mt-3 text-[12px] leading-[1.6] text-[#596174] sm:text-[13px] dark:text-[#d1d8e8]">Several recent notes point to drafts, filters, and a clearer way to return to unfinished tasks.</p>
                </div>
                <a className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold text-[#405783] no-underline hover:underline dark:text-[#d1def9]" href="#how-it-works">
                  See how it comes together <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" />
                </a>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
