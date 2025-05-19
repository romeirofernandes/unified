import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Testimonials from "../components/landing/Testimonials";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

const Landing = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#171717] text-[#e5e5e5]">
      <Navbar onGetStarted={() => handleNavigation("/signup")} />

      <main className="container mx-auto max-w-4xl px-6">
        <Hero onGetStarted={() => handleNavigation("/signup")} />
        <Features />
        <Testimonials />
        <CTA onGetStarted={() => handleNavigation("/signup")} />
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
