import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Testimonials from "../components/Testimonials";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#171717] text-[#e5e5e5]">
      <Navbar />

      <main className="container mx-auto max-w-4xl px-6">
        <Hero />
        <Features />
        <Testimonials />
        <CTA />
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
