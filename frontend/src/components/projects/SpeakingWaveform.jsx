// LiveWaveform adapted from the supplied audio-ui waveform component.
import { createSource, Waveform } from "@audio-ui/react";
import { useEffect, useState } from "react";

export default function SpeakingWaveform({ stream }) {
  const [source] = useState(() => createSource(new Float32Array(1)));
  useEffect(() => {
    if (!stream) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    const context = new Context();
    const input = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    input.connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    const level = new Float32Array(1);
    let frame;
    const update = () => {
      analyser.getFloatTimeDomainData(samples);
      level[0] = Math.min(
        1,
        Math.sqrt(
          samples.reduce((sum, sample) => sum + sample * sample, 0) /
            samples.length,
        ) * 4,
      );
      source.set(level);
      frame = requestAnimationFrame(update);
    };
    context.resume().catch(() => {});
    update();
    return () => {
      cancelAnimationFrame(frame);
      input.disconnect();
      analyser.disconnect();
      context.close().catch(() => {});
    };
  }, [stream, source]);
  return (
    <Waveform.Root
      levels={source}
      role="img"
      aria-label="Microphone input"
      className="relative h-9 min-w-0 flex-1"
    >
      <Waveform.Canvas
        mode="scrolling"
        className="block size-full [--waveform-color:var(--primary)] [--waveform-bar-radius:2px]"
      />
    </Waveform.Root>
  );
}
