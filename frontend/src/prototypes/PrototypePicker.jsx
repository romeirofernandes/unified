import { useEffect, useLayoutEffect, useRef } from "react";
import "./picker.css";

export default function PrototypePicker({ names, value, onChange, onReplay }) {
  const picker = useRef(null);
  useLayoutEffect(() => {
    const move = () => {
      const root = picker.current;
      const item = root.querySelectorAll(".proto-picker-item")[value];
      const highlight = root.querySelector(".proto-picker-highlight");
      highlight.style.width = `${item.offsetWidth}px`;
      highlight.style.transform = `translateX(${item.offsetLeft}px)`;
    };
    move();
    window.addEventListener("resize", move);
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => picker.current?.setAttribute("data-ready", "")));
    return () => { window.removeEventListener("resize", move); cancelAnimationFrame(frame); };
  }, [value]);
  useEffect(() => {
    const keydown = event => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable || event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number.parseInt(event.key, 10);
      if (number >= 1 && number <= names.length) onChange(number - 1);
      else if (event.key === "ArrowRight") { event.preventDefault(); onChange((value + 1) % names.length); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); onChange((value - 1 + names.length) % names.length); }
      else if (event.key.toLowerCase() === "r") onReplay?.();
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [names, value, onChange, onReplay]);
  return <nav ref={picker} className="proto-picker" aria-label="Prototype variants">
    <span className="proto-picker-highlight" aria-hidden="true" />
    {names.map((name, index) => <button key={name} className="proto-picker-item" data-active={index === value ? "" : undefined} aria-current={index === value ? "true" : undefined} onClick={() => onChange(index)}>{name}</button>)}
    {onReplay && <><span className="proto-picker-divider" aria-hidden="true" /><button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={onReplay}>↻</button></>}
  </nav>;
}
