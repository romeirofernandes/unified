import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

export default function ToastNotice({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message || typeof document === "undefined") return null;
  return createPortal(<div className="fixed bottom-5 end-5 z-[100] flex max-w-[calc(100vw-2.5rem)] items-center gap-4 rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg">
    <p role="status">{message}</p>
    <Button variant="ghost" size="compact" onClick={onClose}>Dismiss</Button>
  </div>, document.body);
}
