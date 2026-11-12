import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import Navbar from "../components/landing/Navbar";
import HeroBackground from "../components/landing/HeroBackground";
import Hero from "../components/landing/Hero";
import ProductPreview from "../components/landing/ProductPreview";
import FeedbackLoop from "../components/landing/FeedbackLoop";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

export default function Landing({ digestSection = null }) {
  return (
    <ReactLenis root options={{ anchors: { offset: -80 }, duration: 1.05, smoothWheel: true }}>
      <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-[#f4f3ee] font-sans text-[#24231f] transition-colors duration-700 dark:bg-[#141413] dark:text-[#f4f1e9] motion-reduce:transition-none">
        <a className="sr-only z-50 rounded-md bg-white p-3 text-[#24231f] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-[#405783]" href="#main-content">Skip to content</a>
        <Navbar />
        <div id="main-content" className="w-full min-w-0 scroll-mt-24">
          <HeroBackground>
            <Hero />
            <ProductPreview />
          </HeroBackground>
          <FeedbackLoop />
          {digestSection}
          <CTA />
        </div>
        <Footer />
      </main>
    </ReactLenis>
  );
}
