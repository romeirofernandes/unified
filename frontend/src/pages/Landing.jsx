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
    <div className="relative min-h-screen bg-[#171717] text-[#e5e5e5]">
      <Navbar onGetStarted={() => handleNavigation("/signup")} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Hero onGetStarted={() => handleNavigation("/signup")} />
        <div className="space-y-32">
          <Features />
          <Testimonials />
          <CTA onGetStarted={() => handleNavigation("/signup")} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Landing;
