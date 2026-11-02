import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Process from "../components/landing/Testimonials";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f4f3ee] text-[#1c1b19] font-sans dark:bg-[#201f1d] dark:text-[#f2f0ea]">
      <Navbar onGetStarted={() => navigate("/signup")} />
      <div className="mx-auto w-full max-w-[1160px] px-5 sm:px-8">
        <Hero
          onGetStarted={() => navigate("/signup")}
        />
        <Features />
        <Process />
        <CTA onGetStarted={() => navigate("/signup")} />
      </div>
      <Footer />
    </main>
  );
}
