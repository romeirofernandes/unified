import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mic01Icon, StopIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
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
  const [open, setOpen] = useState(true);
  const { user } = useAuth();
  const speech = useSpeechInput(active && open, user?.uid);
  const [language, setLanguage] = useState("auto");
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
        <span className="flex-1 text-left">
          Describe your form{" "}
          <span className="block text-xs font-normal text-muted-foreground">
            Speak or type the questions you need.
          </span>
        </span>
        <CollapsibleIndicator />
      </CollapsibleTrigger>
      <CollapsibleContent contentClassName="space-y-4 border-t border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant={speech.listening ? "destructive" : "secondary"}
            onClick={() =>
              speech.listening ? speech.stop() : speech.start(language)
            }
            disabled={
              !speech.supported ||
              pending ||
              speech.requesting ||
              speech.transcribing
            }
            loading={speech.requesting || speech.transcribing}
            aria-pressed={speech.listening}
          >
            <HugeiconsIcon
              icon={speech.listening ? StopIcon : Mic01Icon}
              size={16}
              aria-hidden="true"
            />
            {speech.transcribing
              ? "Transcribing…"
              : speech.requesting
                ? "Opening microphone…"
                : speech.listening
                  ? "Stop recording"
                  : "Start recording"}
          </Button>
          <div className="w-44">
            <Select
              value={language}
              disabled={
                speech.listening ||
                speech.requesting ||
                speech.transcribing ||
                pending
              }
              onValueChange={setLanguage}
            >
              <SelectTrigger
                aria-label="Speech language"
                className="h-10 w-full rounded-md"
              />
              <SelectContent>
                {[
                  ["auto", "Auto-detect"],
                  ["en", "English"],
                  ["hi", "Hindi"],
                  ["es", "Spanish"],
                  ["fr", "French"],
                  ["de", "German"],
                  ["pt", "Portuguese"],
                  ["ja", "Japanese"],
                ].map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="form-description"
            className="text-xs text-muted-foreground"
          >
            Your description
          </label>
          <textarea
            id="form-description"
            value={speech.transcript}
            readOnly={
              speech.listening || speech.requesting || speech.transcribing
            }
            disabled={pending}
            onChange={(event) => {
              speech.setTranscript(event.target.value);
              setDraft(null);
            }}
            rows={4}
            maxLength={12000}
            placeholder="Ask for a name, a 1–10 rating, and what we could improve. Add a choice between design, speed, and features."
            className="w-full resize-y rounded-md border border-input bg-background p-3 text-base leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
          />
        </div>
        <p role="status" className="text-xs leading-5 text-muted-foreground">
          {speech.listening
            ? `Recording ${Math.floor(speech.seconds / 60)}:${String(speech.seconds % 60).padStart(2, "0")}. Stop when you are finished.`
            : speech.transcribing
              ? "Transcribing your recording… Your words will appear when it is ready."
              : speech.supported
                ? "Record up to two minutes. Audio is sent to Groq after you stop. Review the transcript before generating."
                : "Recording is not available in this browser. Use HTTPS and allow microphone access, or type your description."}
        </p>
        <ErrorMessage>{speech.error || error}</ErrorMessage>
        <Button
          variant="secondary"
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
