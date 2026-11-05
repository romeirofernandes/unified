import { useEffect, useState } from "react";

export function useDemoLoop(active) {
  const [phase, setPhase] = useState("idle");
  useEffect(() => {
    if (!active) return;
    let timers = [];
    const clear = () => timers.forEach(clearTimeout);
    const cycle = () => {
      clear();
      if (document.hidden) return;
      setPhase("idle");
      timers = [
        setTimeout(() => setPhase("point"), 700),
        setTimeout(() => setPhase("click"), 1500),
        setTimeout(() => setPhase("copied"), 1750),
        setTimeout(() => setPhase("rest"), 3000),
        setTimeout(cycle, 5000),
      ];
    };
    const visibility = () => { clear(); if (!document.hidden) cycle(); };
    document.addEventListener("visibilitychange", visibility);
    cycle();
    return () => { clear(); document.removeEventListener("visibilitychange", visibility); };
  }, [active]);
  return phase;
}
