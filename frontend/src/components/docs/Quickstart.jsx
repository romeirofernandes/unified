import { activeDocSection } from "@/lib/active-doc-section";
import PageHeader from "@/components/shared/PageHeader";
import CopyButton from "@/components/shared/CopyButton";
import PackageCommands from "@/components/shared/PackageCommands";
import { useEffect, useRef, useState } from "react";
import { BounceSidebar } from "@/components/motion/bounce-sidebar";
import { Link } from "react-router-dom";
import CodeBlock from "@/components/shared/CodeBlock";
import { Button } from "@/components/ui/button";
import { sdkVersion } from "@/lib/integration-code";
import { steps, documentationMarkdown } from "@/lib/documentation";
export { documentationMarkdown } from "@/lib/documentation";

export default function Quickstart() {
  const contentRef = useRef(null);
  const articleRef = useRef(null);
  const [active, setActive] = useState(steps[0].id);
  useEffect(() => {
    let frame;
    const scroller = articleRef.current;
    const content = contentRef.current;
    const update = () => {
      if (!scroller || !content) return;
      const viewport = scroller.getBoundingClientRect();
      const sections = steps.map(({ id }) => ({ id, top: content.querySelector(`#${id}`)?.getBoundingClientRect().top ?? Infinity }));
      setActive(activeDocSection(sections, viewport.top, viewport.height));
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    scroller?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const observer = new ResizeObserver(onScroll);
    if (content) observer.observe(content);
    if (scroller) observer.observe(scroller);
    update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); scroller?.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-8">
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_220px] xl:gap-16">
        <PageHeader title="Documentation" description="Set up the widget, connect your own form, and bring feedback into your workflow." />
        <div className="xl:ps-8"><CopyButton value={documentationMarkdown} label="page" showLabel /></div>
      </div>
      <div className="grid min-h-0 min-w-0 flex-1 gap-10 xl:grid-cols-[minmax(0,1fr)_220px] xl:gap-16">
        <article ref={articleRef} tabIndex={0} aria-label="Documentation article" className="min-h-0 min-w-0 overflow-y-auto pe-2 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div ref={contentRef} className="min-w-0 max-w-4xl space-y-12 pb-[60vh]">
          {steps.map((step, index) => (
            <section
              key={step.id}
              id={step.id}
              aria-labelledby={`${step.id}-title`}
              className="min-w-0 scroll-mt-5 space-y-6 border-b border-border pb-12 last:border-0 last:pb-0"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-xs text-muted-foreground">
                  0{index + 1}
                </span>
                <h2
                  id={`${step.id}-title`}
                  className="text-2xl tracking-tight sm:text-3xl"
                >
                  {step.title}
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                {step.description}
              </p>
              {step.items && (
                <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                  {step.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 size-1 shrink-0 rounded-full bg-fluid-accent"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {step.id === "install" && <><p className="text-sm text-muted-foreground">These commands install SDK {sdkVersion}. Older widget installations must update to use this secured backend. Yarn commands require Yarn 2 or newer.</p><PackageCommands automatic /></>}
              {step.id === "integrate" && <PackageCommands />}
              {step.code && <CodeBlock code={step.code} label={step.label} />}
              {step.id === "integrate" && (
                <div className="rounded-lg border border-border bg-card px-5 py-4 text-sm leading-6 text-muted-foreground">
                  Replace{" "}
                  <code className="font-mono text-xs text-foreground">
                    YOUR_PROJECT_ID
                  </code>{" "}
                  with the values in your project’s{" "}
                  <span className="text-foreground">Preview</span> panel.
                </div>
              )}
              {step.action && (
                <Button variant="secondary" asChild>
                  <Link to="/dashboard">Open your workspace</Link>
                </Button>
              )}
            </section>
          ))}
        </div>
        </article>
        <aside onClick={(event) => {
          const link = event.target.closest('a[href^="#"]');
          if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const section = document.getElementById(link.hash.slice(1));
          if (!section) return;
          event.preventDefault();
          const scroller = articleRef.current;
          if (!scroller) return;
          const top = section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 20;
          history.replaceState(history.state, "", link.hash);
          scroller.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
        }} className="hidden self-start space-y-6 xl:block">
          <BounceSidebar items={steps.map((step) => ({ id: step.id, label: step.title, href: `#${step.id}` }))} value={active} onValueChange={setActive} ariaLabel="On this page" itemClassName="text-sm" indicatorClassName="bg-fluid-accent" />
          <p className="ps-5 text-xs leading-6 text-muted-foreground">
            Already set up? Open a project to view responses and generate a
            feedback summary.
          </p>
        </aside>
      </div>
    </div>
  );
}
