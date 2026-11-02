import { Suspense, lazy } from "react";

const GitMerge = lazy(() => import("anatomy-figures/git-merge"));

export default function MergeFigure() {
  return (
    <div className="w-full min-w-0 rounded-[18px] border border-white/70 bg-[#f5f3ed] p-1.5 shadow-[0_16px_40px_rgb(0_0_0_/_18%)] sm:rounded-[22px] sm:p-3">
      <Suspense fallback={<div className="grid min-h-[280px] place-items-center rounded-[14px] bg-[#ebe8df]" aria-label="Loading illustration" />}>
        <GitMerge
          theme="paper"
          className="mx-auto w-full max-w-full overflow-hidden rounded-[14px] [&_.iso-legend]:hidden [&_.iso-plate-corners]:hidden"
          tokens={{
            "--anatomy-card": "#f5f3ed",
            "--anatomy-lit": "#7c99d7",
          }}
        />
      </Suspense>
    </div>
  );
}
