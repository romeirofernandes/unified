import { useEffect, useRef } from "react";
import { Toast } from "@animate-ui/react/primitives/base-ui/toast";

function ToastContent({ message, onClose }) {
  const { toasts, add, close } = Toast.useToastManager();
  const current = useRef(null);
  const previous = useRef("");
  useEffect(() => {
    if (message === previous.current) return;
    previous.current = message;
    const old = current.current;
    current.current = null;
    if (old) close(old);
    if (!message) return;
    const id = add({ title: message, timeout: 6000, onClose: () => {
      if (current.current !== id) return;
      current.current = null;
      onClose();
    } });
    current.current = id;
  }, [message, onClose, add, close]);
  return <Toast.Portal>
    <Toast.Viewport className="fixed bottom-5 end-5 z-[100] w-96 max-w-[calc(100vw-2.5rem)] outline-none">
      {toasts.map((toast) => <Toast.Root key={toast.id} toast={toast} className="absolute bottom-0 end-0 w-full overflow-hidden rounded-md border border-border bg-card px-4 py-3 text-foreground shadow-lg">
        <Toast.Content className="flex items-center gap-4">
          <Toast.Title className="min-w-0 flex-1 text-sm leading-6" />
          <Toast.Close className="shrink-0 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring" aria-label="Dismiss notification">Dismiss</Toast.Close>
        </Toast.Content>
      </Toast.Root>)}
    </Toast.Viewport>
  </Toast.Portal>;
}

export default function ToastNotice(props) {
  return <Toast.Provider><ToastContent {...props} /></Toast.Provider>;
}
