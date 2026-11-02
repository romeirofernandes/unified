import { Suspense, lazy } from "react";

const MessageQueue = lazy(() => import("anatomy-figures/message-queue"));

export default function QueueFigure() {
  return (
    <div className="w-full min-w-0 rounded-[20px] border border-white/70 bg-[#f5f3ed] p-2 shadow-[0_20px_50px_rgb(0_0_0_/_18%)] sm:rounded-[26px] sm:p-4">
      <Suspense fallback={<div className="grid min-h-[320px] place-items-center rounded-[16px] bg-[#ebe8df] text-sm text-[#625f59]">Loading the feedback queue…</div>}>
        <MessageQueue
          theme="paper"
          tokens={{
            "--anatomy-card": "#f5f3ed",
            "--anatomy-lit": "#7c99d7",
          }}
        />
      </Suspense>
    </div>
  );
}
