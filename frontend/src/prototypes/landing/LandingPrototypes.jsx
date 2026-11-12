import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import HeroBackground from "@/components/landing/HeroBackground";
import Hero from "@/components/landing/Hero";
import ProductPreview from "@/components/landing/ProductPreview";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import PrototypePicker from "../PrototypePicker";
import WorkbenchFirst from "./WorkbenchFirst";
import IsometricFlow from "./IsometricFlow";
import ReleaseStory from "./ReleaseStory";
import "./landing.css";
const variants = [WorkbenchFirst, IsometricFlow, ReleaseStory];
const names = ["Workbench", "Isometric", "Release story"];
export default function LandingPrototypes() {
  const location = useLocation();
  const navigate = useNavigate();
  const value = Math.min(2, Math.max(0, Number(location.pathname.slice(1)) - 1));
  const [replay, setReplay] = useState(0);
  const Variant = variants[value];
  return <main className="lp-page min-h-screen w-full min-w-0 overflow-x-clip bg-[#f4f3ee] font-sans text-[#24231f] dark:bg-[#141413] dark:text-[#f4f1e9]">
    <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 z-50 bg-card p-3" href="#main-content">Skip to content</a>
    <Navbar /><div id="main-content"><HeroBackground><Hero /><ProductPreview /></HeroBackground><div key={`${value}-${replay}`}><Variant /></div><CTA /></div><Footer />
    <PrototypePicker names={names} value={value} onChange={index => navigate(`/${index + 1}?v=${index + 1}`, { replace: true, preventScrollReset: true })} onReplay={() => setReplay(replay + 1)} />
  </main>;
}
