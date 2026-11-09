import SpeakingWaveform from "./SpeakingWaveform";
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mic01Icon, StopIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  CollapsibleIndicator,
} from "@/components/motion/collapsible";
import { ErrorMessage } from "@/components/shared/PageState";
import { useSpeechInput } from "@/hooks/use-speech-input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";

export default function VoiceFormBuilder({ active, onApply }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const speech = useSpeechInput(active && open, user?.uid);
  const [draft, setDraft] = useState(null);
  const [pending, setPending] = useState(false);
  const request = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active) {
      request.current?.abort();
      setPending(false);
    }
    return () => request.current?.abort();
  }, [active]);

  async function generate() {
    if (
      pending ||
      speech.listening ||
      speech.transcribing ||
      speech.requesting ||
      !speech.transcript.trim()
    )
      return;
    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setError("");
    setDraft(null);
    try {
      setDraft(
        await apiRequest("/projects/generate-form", {
          method: "POST",
          uid: user?.uid,
          body: { transcript: speech.transcript.trim() },
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(60000),
          ]),
        }),
      );
    } catch (error) {
      if (!controller.signal.aborted) setError(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-md border border-fluid-accent/30 bg-fluid-accent/5"
    >
      <CollapsibleTrigger className="rounded-md px-4 py-3 hover:bg-transparent">
        <HugeiconsIcon icon={Mic01Icon} size={18} aria-hidden="true" />
        <span className="flex-1 text-left">Describe your form </span>
        <CollapsibleIndicator />
      </CollapsibleTrigger>
      <CollapsibleContent contentClassName="space-y-4 border-t border-border p-4">
        <div className="space-y-2">
          <div className="relative flex flex-col gap-3 rounded-md border border-input bg-background p-3 shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
            <Textarea
              id="form-description"
              aria-label="Describe your form"
              value={speech.transcript}
              readOnly={
                speech.listening || speech.requesting || speech.transcribing
              }
              disabled={pending}
              onChange={(event) => {
                speech.setTranscript(event.target.value);
                setDraft(null);
              }}
              rows={3}
              maxLength={12000}
              placeholder={
                speech.listening
                  ? ""
                  : "Ask for a name, a 1–10 rating, and what we could improve. Add a choice between design, speed, and features."
              }
              className={`${speech.listening ? "text-transparent caret-transparent" : ""} min-h-20 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0`}
            />
            {speech.listening && (
              <div className="pointer-events-none absolute inset-x-6 top-3 flex h-20 items-center justify-center">
                <SpeakingWaveform stream={speech.stream} />
              </div>
            )}
            <div className="flex min-h-9 items-center justify-end gap-3">
              <Button
                size="icon"
                variant={speech.listening ? "destructive" : "secondary"}
                className="ml-auto size-9 min-h-9 shrink-0 rounded-md p-0"
                aria-label={
                  speech.listening ? "Stop recording" : "Record description"
                }
                aria-pressed={speech.listening}
                onClick={() =>
                  speech.listening ? speech.stop() : speech.start()
                }
                disabled={
                  !speech.supported ||
                  pending ||
                  speech.requesting ||
                  speech.transcribing
                }
                loading={speech.requesting || speech.transcribing}
              >
                <HugeiconsIcon
                  icon={speech.listening ? StopIcon : Mic01Icon}
                  size={18}
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        </div>
        <p role="status" className="text-xs leading-5 text-muted-foreground">
          {speech.listening
            ? `Recording ${Math.floor(speech.seconds / 60)}:${String(speech.seconds % 60).padStart(2, "0")}. Stop when you are finished.`
            : speech.transcribing
              ? "Transcribing your recording… Your words will appear when it is ready."
              : speech.supported
                ? ""
                : "Recording is not available in this browser. Use HTTPS and allow microphone access, or type your description."}
        </p>
        <ErrorMessage>{speech.error || error}</ErrorMessage>
        <div className="flex justify-end">
          <Button
            onClick={generate}
            disabled={
              pending ||
              speech.listening ||
              speech.requesting ||
              speech.transcribing ||
              !speech.transcript.trim()
            }
            loading={pending}
          >
            Generate draft
          </Button>
        </div>
        {draft && (
          <div className="space-y-3 rounded-md border border-border bg-background p-3">
            <p className="text-sm font-medium">
              {draft.fields.length
                ? `${draft.fields.length} questions ready to review`
                : "No questions found"}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {draft.fields.map((field, index) => (
                <li key={index}>
                  {index + 1}. {field.label}
                </li>
              ))}
            </ul>
            {draft.fields.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground">
                  Adds these questions to your form. Your existing questions
                  stay in place.
                </p>
                <Button
                  onClick={() => {
                    onApply(draft);
                    setDraft(null);
                    setOpen(false);
                  }}
                >
                  Add questions to form
                </Button>
              </>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
