import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Landing from "@/pages/Landing";
import PrototypePicker from "../PrototypePicker";
import Dispatch from "./Dispatch";
import Signal from "./Signal";
import Orbit from "./Orbit";
import "./digest.css";
const variants = [Dispatch, Signal, Orbit];
const names = ["Dispatch", "Signal", "Orbit"];
export default function DigestPrototypes() {
  const [params, setParams] = useSearchParams();
  const value = Math.min(2, Math.max(0, (Number(params.get("v")) || 1) - 1));
  const [replay, setReplay] = useState(0);
  const Variant = variants[value];
  useEffect(() => {
    const frame = requestAnimationFrame(() => document.getElementById("digest-section")?.scrollIntoView({ block:"start" }));
    return () => cancelAnimationFrame(frame);
  }, []);
  return <><Landing digestSection={<div key={`${value}-${replay}`}><Variant /></div>} /><PrototypePicker names={names} value={value} onChange={index => setParams({ v:index + 1 }, { replace:true, preventScrollReset:true })} onReplay={() => setReplay(replay + 1)} /></>;
}
