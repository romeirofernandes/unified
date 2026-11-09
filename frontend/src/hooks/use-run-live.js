import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";

export function useRunLive(path, uid, enabled, setData) {
  const [connected, setConnected] = useState(false);
  const update = useRef(setData);
  useEffect(() => { update.current = setData; }, [setData]);
  useEffect(() => {
    if (!enabled || !uid) return;
    const controller = new AbortController();
    let retry, failures = 0, fetching = false, dirty = false;
    async function refreshSnapshot() {
      dirty = true;
      if (fetching) return;
      fetching = true;
      try {
        do {
          dirty = false;
          const snapshot = await apiRequest(path, { uid, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
          if (!controller.signal.aborted) update.current(snapshot);
        } while (dirty && !controller.signal.aborted);
      } catch { if (!controller.signal.aborted) setConnected(false); }
      finally { fetching = false; }
    }
    async function connect() {
      try {
        const body = await apiRequest(`${path}/events`, { uid, stream: true, signal: controller.signal, headers: { Accept: "text/event-stream" } });
        const reader = body.getReader(), decoder = new TextDecoder();
        let buffer = "";
        try {
          while (!controller.signal.aborted) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let boundary;
            while ((boundary = buffer.indexOf("\n\n")) !== -1) {
              const event = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
              if (/^event: (ready|change|heartbeat)$/m.test(event)) {
                failures = 0; setConnected(true); refreshSnapshot();
              }
            }
          }
        } finally { await reader.cancel().catch(() => {}); }
      } catch (error) {
        if ([401, 403, 404].includes(error.status)) { setConnected(false); return; }
      }
      if (!controller.signal.aborted) {
        setConnected(false);
        retry = setTimeout(connect, Math.min(15000, 1000 * 2 ** failures++));
      }
    }
    connect();
    return () => { controller.abort(); clearTimeout(retry); };
  }, [path, uid, enabled]);
  return enabled && connected;
}
