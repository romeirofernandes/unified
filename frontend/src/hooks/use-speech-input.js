import { useEffect, useRef, useState } from "react";

const join = (...parts) => parts.filter(Boolean).join(" ").trim();
export function useSpeechInput(active = true) {
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);
  const buffer = useRef({ final: "", interim: "" });
  const supported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  function stop() {
    recognitionRef.current?.stop();
  }
  function start(language) {
    if (!supported || !active || recognitionRef.current) return;
    setError("");
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    const prefix = transcript.trim();
    buffer.current = { final: prefix, interim: "" };
    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const final = join(
        prefix,
        results
          .filter((result) => result.isFinal)
          .map((result) => result[0].transcript)
          .join(" "),
      );
      const partial = results
        .filter((result) => !result.isFinal)
        .map((result) => result[0].transcript)
        .join(" ");
      buffer.current = { final, interim: partial };
      setTranscript(final);
      setInterim(partial);
    };
    recognition.onerror = (event) => {
      const messages = {
        "not-allowed":
          "Microphone access was denied. Allow it in browser settings, or type your description.",
        "audio-capture":
          "No microphone is available. You can type your description instead.",
        network:
          "Speech recognition could not connect. Try again, or type your description.",
        "no-speech": "No speech was detected. Try again when you are ready.",
      };
      if (event.error !== "aborted")
        setError(
          messages[event.error] ||
            "Speech recognition stopped. You can continue by typing.",
        );
    };
    recognition.onend = () => {
      setTranscript(join(buffer.current.final, buffer.current.interim));
      setInterim("");
      setListening(false);
      recognitionRef.current = null;
    };
    try {
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
      setError(
        "Speech recognition could not start. You can type your description instead.",
      );
    }
  }
  useEffect(() => {
    if (!active) {
      recognitionRef.current?.stop();
      setListening(false);
      setInterim("");
    }
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = recognition.onend = recognition.onerror = null;
        recognition.abort();
        recognitionRef.current = null;
      }
    };
  }, [active]);
  return {
    transcript,
    setTranscript,
    interim,
    listening,
    supported,
    error,
    start,
    stop,
  };
}
