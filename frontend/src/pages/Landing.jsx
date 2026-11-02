import { useNavigate } from "react-router-dom";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Process from "../components/landing/Testimonials";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";
import "../components/landing/Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main className="landing-page">
      <Navbar onGetStarted={() => navigate("/signup")} />
      <div className="landing-container">
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
