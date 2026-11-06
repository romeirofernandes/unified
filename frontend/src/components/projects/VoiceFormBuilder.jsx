import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mic01Icon, StopIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleIndicator } from "@/components/motion/collapsible";
import { ErrorMessage } from "@/components/shared/PageState";
import { useSpeechInput } from "@/hooks/use-speech-input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";

export default function VoiceFormBuilder({ active, onApply }) {
  const [open, setOpen] = useState(true);
  const speech = useSpeechInput(active && open);
  const { user } = useAuth();
  const [language, setLanguage] = useState("en-IN");
  const [draft, setDraft] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (pending || speech.listening || !speech.transcript.trim()) return;
    setPending(true); setError(""); setDraft(null);
    try { setDraft(await apiRequest("/projects/generate-form", { method: "POST", uid: user.uid, body: { transcript: speech.transcript.trim() }, signal: AbortSignal.timeout(60000) })); }
    catch (error) { setError(error.message); }
    finally { setPending(false); }
  }
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border border-fluid-accent/30 bg-fluid-accent/5">
      <CollapsibleTrigger className="rounded-md px-4 py-3 hover:bg-transparent"><HugeiconsIcon icon={Mic01Icon} size={18} aria-hidden="true" /><span className="flex-1 text-left">Describe your form <span className="block text-xs font-normal text-muted-foreground">Speak or type the questions you need.</span></span><CollapsibleIndicator /></CollapsibleTrigger>
      <CollapsibleContent contentClassName="space-y-4 border-t border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant={speech.listening ? "destructive" : "secondary"} onClick={() => speech.listening ? speech.stop() : speech.start(language)} disabled={!speech.supported || pending} aria-pressed={speech.listening}><HugeiconsIcon icon={speech.listening ? StopIcon : Mic01Icon} size={16} aria-hidden="true" />{speech.listening ? "Stop recording" : "Start recording"}</Button>
          <label className="text-xs text-muted-foreground"><span className="sr-only">Speech language</span><select value={language} disabled={speech.listening || pending} onChange={(event) => setLanguage(event.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm text-foreground"><option value="en-IN">English (India)</option><option value="en-US">English (US)</option><option value="hi-IN">Hindi</option></select></label>
        </div>
        <div className="space-y-2"><label htmlFor="form-description" className="text-xs text-muted-foreground">Your description</label><textarea id="form-description" value={[speech.transcript, speech.interim].filter(Boolean).join(" ")} readOnly={speech.listening} disabled={pending} onChange={(event) => { speech.setTranscript(event.target.value); setDraft(null); }} rows={4} maxLength={12000} placeholder="Ask for a name, a 1–10 rating, and what we could improve. Add a choice between design, speed, and features." className="w-full resize-y rounded-md border border-input bg-background p-3 text-base leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm" /></div>
        <p role="status" className="text-xs leading-5 text-muted-foreground">{speech.listening ? "Listening… Your words appear above." : speech.supported ? "Review the transcript before generating. Your browser may use an online speech service." : "Voice input is not supported in this browser. Type your description to generate the same draft."}</p>
        <ErrorMessage>{speech.error || error}</ErrorMessage>
        <Button variant="secondary" onClick={generate} disabled={pending || speech.listening || !speech.transcript.trim()} loading={pending}>Generate draft</Button>
        {draft && <div className="space-y-3 rounded-md border border-border bg-background p-3"><p className="text-sm font-medium">{draft.fields.length ? `${draft.fields.length} questions ready to review` : "No questions found"}</p><ul className="space-y-2 text-sm text-muted-foreground">{draft.fields.map((field, index) => <li key={index}>{index + 1}. {field.label}</li>)}</ul>{draft.fields.length > 0 && <><p className="text-xs text-muted-foreground">Adds these questions to your form. Your existing questions stay in place.</p><Button onClick={() => { onApply(draft); setDraft(null); setOpen(false); }}>Add questions to form</Button></>}</div>}
      </CollapsibleContent>
    </Collapsible>
  );
}
