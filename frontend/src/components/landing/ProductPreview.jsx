import { useRef, useState } from "react";
import { motion as Motion, useInView, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cursor01Icon, DashboardSquare01Icon, File01Icon, PauseIcon, PlayIcon, Settings01Icon, SidebarLeft01Icon } from "@hugeicons/core-free-icons";
import Brand from "@/components/shared/Brand";
import SummaryCard from "@/components/feedback/SummaryCard";
import CopyButton from "@/components/shared/CopyButton";
import { feedbackPrompt } from "@/lib/feedback-prompt";
import { Button } from "@/components/ui/button";
import { demoSummary } from "./demo/data";
import { useDemoLoop } from "./demo/use-demo-loop";

const navigation = [
  { label: "Projects", icon: DashboardSquare01Icon, active: true },
  { label: "Documentation", icon: File01Icon },
  { label: "Settings", icon: Settings01Icon },
];

export default function ProductPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.15 });
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const phase = useDemoLoop(inView && !paused && !reduce);
  const cursorVisible = !paused && !reduce && ["point", "click"].includes(phase);

  return (
    <section ref={ref} id="product" className="w-full overflow-x-clip px-4 pb-24 pt-5 sm:px-8 sm:pb-28 sm:pt-8 lg:px-12 lg:pb-32" aria-label="Interactive product demo with sample feedback">
      <div className="mx-auto w-full max-w-[1200px] overflow-hidden rounded-md border border-border bg-background text-foreground shadow-[0_24px_60px_rgb(0_0_0_/_12%)]">
        <div className="grid min-w-0 md:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="hidden flex-col border-e border-border bg-background p-4 md:flex lg:p-5">
            <Brand />
            <div className="mt-8 space-y-2" aria-hidden="true">
              {navigation.map(({ label, icon, active }) => (
                <div key={label} className={`flex min-h-10 items-center gap-3 rounded-md px-2 text-sm ${active ? "bg-fluid-accent/10 font-medium text-foreground" : "text-muted-foreground"}`}>
                  <HugeiconsIcon icon={icon} size={18} />{label}
                </div>
              ))}
            </div>
            <div className="mt-auto space-y-1 border-t border-border pt-4 text-xs">
              <p className="font-medium">Acme Studio</p>
              <p className="text-muted-foreground">Sample workspace</p>
            </div>
          </aside>
          <div className="min-w-0">
            <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3 text-xs sm:text-sm">
                <HugeiconsIcon icon={SidebarLeft01Icon} size={17} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate"><span className="text-muted-foreground">Workspace / Projects / </span>Responses</span>
              </div>
              {!reduce && <Button variant="ghost" size="icon" aria-label={paused ? "Play product demo" : "Pause product demo"} title={paused ? "Play demo" : "Pause demo"} onClick={() => { setPaused((value) => !value); }}>
                <HugeiconsIcon icon={paused ? PlayIcon : PauseIcon} size={16} aria-hidden="true" />
              </Button>}
            </div>
            <div className="space-y-5 p-4 sm:p-6" onFocusCapture={() => setPaused(true)}>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl tracking-tight sm:text-3xl">Acme website</h2>
                  <span className="rounded-full border border-fluid-accent/25 bg-fluid-accent/10 px-2 py-0.5 text-[10px] text-muted-foreground">Sample project</span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground sm:text-sm">3 responses. Your feedback summary is up to date.</p>
              </div>
              <div onPointerDownCapture={() => setPaused(true)}>
                <SummaryCard summary={demoSummary} current copyAction={
                  <Motion.div className="relative" animate={{ scale: phase === "click" && !paused && !reduce ? 0.96 : 1 }} transition={{ duration: 0.15 }}>
                    <CopyButton value={feedbackPrompt(demoSummary)} label="prompt" showLabel previewCopied={!paused && !reduce && ["copied", "rest"].includes(phase)} />
                    <Motion.div aria-hidden="true" className="pointer-events-none absolute end-3 top-7 z-20 text-foreground" initial={false} animate={{ opacity: cursorVisible ? 1 : 0, x: phase === "idle" ? 20 : 0, y: phase === "idle" ? 16 : 0 }} transition={{ duration: reduce ? 0 : 0.3 }}>
                      <HugeiconsIcon icon={Cursor01Icon} size={24} className="fill-background drop-shadow-sm" />
                    </Motion.div>
                  </Motion.div>
                } />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
