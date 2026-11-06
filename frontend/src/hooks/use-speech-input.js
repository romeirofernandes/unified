import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";

export function useSpeechInput(active = true, uid) {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const session = useRef(null);
  const revision = useRef(0);
  const supported =
    typeof window !== "undefined" &&
    !!window.MediaRecorder &&
    !!navigator.mediaDevices?.getUserMedia;

  function stop() {
    const current = session.current;
    if (current?.recorder?.state === "recording") current.recorder.stop();
  }
  async function start(language) {
    if (!supported || !active || session.current) return;
    const id = ++revision.current;
    session.current = { id };
    setError("");
    setRequesting(true);
    setSeconds(0);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      if (id !== revision.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType, audioBitsPerSecond: 128000 } : undefined,
      );
      const chunks = [];
      const controller = new AbortController();
      const current = { id, recorder, stream, controller, timer: null };
      session.current = current;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        setError("Recording failed. Please try again.");
        recorder.stop();
      };
      recorder.onstop = async () => {
        clearInterval(current.timer);
        stream.getTracks().forEach((track) => track.stop());
        if (id !== revision.current) return;
        setListening(false);
        setTranscribing(true);
        try {
          const audio = new Blob(chunks, {
            type: recorder.mimeType || mimeType || "audio/webm",
          });
          if (!audio.size || audio.size > 12 * 1024 * 1024)
            throw new Error(
              "The recording is empty or too large. Please record again.",
            );
          const result = await apiRequest(
            `/projects/transcribe?language=${encodeURIComponent(language)}`,
            {
              method: "POST",
              uid,
              rawBody: audio,
              headers: { "Content-Type": audio.type },
              signal: AbortSignal.any([
                controller.signal,
                AbortSignal.timeout(60000),
              ]),
            },
          );
          if (id === revision.current)
            setTranscript((previous) =>
              [previous.trim(), result.text].filter(Boolean).join(" "),
            );
        } catch (error) {
          if (!controller.signal.aborted) setError(error.message);
        } finally {
          if (id === revision.current) {
            setTranscribing(false);
            session.current = null;
          }
        }
      };
      let elapsed = 0;
      current.timer = setInterval(() => {
        setSeconds(++elapsed);
        if (elapsed >= 120) stop();
      }, 1000);
      recorder.start();
      setListening(true);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      if (id === revision.current) {
        session.current = null;
        setError(
          error.name === "NotAllowedError"
            ? "Microphone access was denied. Allow it in browser settings, or type your description."
            : "Could not start recording. Check your microphone, or type your description.",
        );
      }
    } finally {
      if (id === revision.current) setRequesting(false);
    }
  }
  const cancelRecording = useCallback(() => {
    revision.current++;
    const current = session.current;
    if (current) {
      clearInterval(current.timer);
      current.controller?.abort();
      if (current.recorder) {
        current.recorder.onstop =
          current.recorder.ondataavailable =
          current.recorder.onerror =
            null;
        if (current.recorder.state !== "inactive") current.recorder.stop();
      }
      current.stream?.getTracks().forEach((track) => track.stop());
    }
    session.current = null;
  }, []);
  useEffect(() => {
    if (!active) {
      setListening(false);
      setRequesting(false);
      setTranscribing(false);
    }
    return cancelRecording;
  }, [active, cancelRecording]);
  return {
    transcript,
    setTranscript,
    listening,
    requesting,
    transcribing,
    seconds,
    supported,
    error,
    start,
    stop,
  };
}
