import { AlertDialog } from "@base-ui/react/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";
import ToastNotice from "@/components/shared/ToastNotice";
import { ErrorMessage } from "@/components/shared/PageState";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { InputCopy } from "@/components/ui/input-copy";
import CodeBlock from "@/components/shared/CodeBlock";

export default function ProjectApi({ project, uid }) {
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast] = useState("");
  const dismissToast = useCallback(() => setToast(""), []);
  const [hasKey, setHasKey] = useState(false);
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    apiRequest(`/projects/${project._id}/submission-key`, { uid, signal: controller.signal })
      .then((data) => { setKey(data.key); setHasKey(!!data.key || !!data.legacy); if (data.legacy) setMessage("This older key cannot be recovered. Replace it once to make the new key available here anytime."); })
      .catch((error) => { if (!controller.signal.aborted) setMessage(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [project._id, uid]);
  async function changeKey(revoke = false) {
    setPending(true); setMessage("");
    try {
      const data = await apiRequest(`/projects/${project._id}/submission-key`, { uid, method: revoke ? "DELETE" : "POST" });
      setKey(data.key || "");
      setHasKey(!revoke);
      setConfirming(false);
      setToast(revoke ? "Key revoked. Requests using it will be rejected." : "Submission key saved. You can copy it here anytime.");
    } catch (error) { setMessage(error.message); }
    finally { setPending(false); }
  }
  const endpoint = `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "")}/api/submissions/${project._id}`;
  const answers = Object.fromEntries((project.fields || []).map((field) => [field._id, field.type === "slider" ? (field.config?.min ?? 0) : field.type === "mcq" ? field.options?.[0]?.value : field.type === "email" ? "person@example.com" : field.type === "date" ? "2026-11-07" : "Your answer"]));
  return <div className="space-y-4">
    <h3>Connect your own form</h3>
    <p className="text-sm text-muted-foreground">Send answers from your existing form to this endpoint. The project key can only submit responses. Keep it on your server to control who can submit.</p>
    {loading && <p className="text-sm text-muted-foreground">Loading submission key…</p>}
    <div className="flex flex-wrap gap-2">
      <Button disabled={pending || loading} onClick={() => changeKey()}>{hasKey ? "Replace key" : "Create key"}</Button>
    </div>
    {hasKey && <div className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-muted/50 p-4">
      <div className="min-w-0 flex-1">{key ? <InputCopy label="Submission key" value={key} /> : <p className="text-sm text-muted-foreground">Replace this older key to make it copyable here.</p>}</div>
      <Button variant="destructive" size="icon-compact" aria-label="Revoke submission key" title="Revoke key" disabled={pending} onClick={() => { setMessage(""); setConfirming(true); }}><HugeiconsIcon icon={Delete01Icon} size={16} aria-hidden="true" /></Button>
    </div>}
    {!confirming && <ErrorMessage>{message}</ErrorMessage>}
    <AlertDialog.Root open={confirming} onOpenChange={(open) => { if (!pending) setConfirming(open); }}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[70] bg-black/40" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[71] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-md border border-border bg-background p-6 text-foreground shadow-xl">
          <AlertDialog.Title className="text-xl">Revoke submission key?</AlertDialog.Title>
          <AlertDialog.Description className="text-sm leading-6 text-muted-foreground">Forms using this key will stop sending feedback. You can create a new key and update your integration afterward.</AlertDialog.Description>
          <ErrorMessage>{message}</ErrorMessage>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>Cancel</Button>
            <Button variant="destructive" loading={pending} onClick={() => changeKey(true)}>Revoke key</Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
    <ToastNotice message={toast} onClose={dismissToast} />
    <CodeBlock label="Server · JavaScript" code={`const response = await fetch(${JSON.stringify(endpoint)}, {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer YOUR_SUBMISSION_KEY"\n  },\n  body: JSON.stringify({ formAnswers: ${JSON.stringify(answers, null, 2)} })\n});\nif (!response.ok) throw new Error("Feedback could not be sent");`} />
    <p className="text-sm text-muted-foreground">Answer keys are the question IDs shown above. Required questions must be answered. Successful submissions appear in this project’s responses and summary.</p>
  </div>;
}
