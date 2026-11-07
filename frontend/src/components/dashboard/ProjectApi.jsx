import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { InputCopy } from "@/components/ui/input-copy";
import CodeBlock from "@/components/shared/CodeBlock";

export default function ProjectApi({ project, uid }) {
  const [key, setKey] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function changeKey(revoke = false) {
    setPending(true); setMessage("");
    try {
      const data = await apiRequest(`/projects/${project._id}/submission-key`, { uid, method: revoke ? "DELETE" : "POST" });
      setKey(data.key || "");
      setMessage(revoke ? "Key revoked. Requests using it will be rejected." : "Copy this key now. Creating another key invalidates the previous one.");
    } catch (error) { setMessage(error.message); }
    finally { setPending(false); }
  }
  const endpoint = `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "")}/api/submissions/${project._id}`;
  const answers = Object.fromEntries((project.fields || []).map((field) => [field._id, field.type === "slider" ? (field.config?.min ?? 0) : field.type === "mcq" ? field.options?.[0]?.value : field.type === "email" ? "person@example.com" : field.type === "date" ? "2026-11-07" : "Your answer"]));
  return <div className="space-y-4 border-t border-border pt-5">
    <h3>Connect your own form</h3>
    <p className="text-sm text-muted-foreground">Send answers from your existing form to this endpoint. The project key can only submit responses. Keep it on your server to control who can submit.</p>
    <div className="flex flex-wrap gap-2">
      <Button disabled={pending} onClick={() => changeKey()}>Create or replace key</Button>
      <Button variant="secondary" disabled={pending} onClick={() => changeKey(true)}>Revoke key</Button>
    </div>
    <p role="status" className="text-sm">{message}</p>
    {key && <InputCopy label="Submission key · copy now" value={key} />}
    <CodeBlock label="Server · JavaScript" code={`const response = await fetch(${JSON.stringify(endpoint)}, {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer YOUR_SUBMISSION_KEY"\n  },\n  body: JSON.stringify({ formAnswers: ${JSON.stringify(answers, null, 2)} })\n});\nif (!response.ok) throw new Error("Feedback could not be sent");`} />
    <p className="text-sm text-muted-foreground">Answer keys are the question IDs shown above. Required questions must be answered. Successful submissions appear in this project’s responses and summary.</p>
  </div>;
}
