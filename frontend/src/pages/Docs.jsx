import { useLocation } from "react-router-dom";
import Quickstart from "@/components/docs/Quickstart";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function Docs() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/dashboard")) return <Quickstart />;
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Navbar />
      <main className="mx-auto w-full max-w-[1296px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <Quickstart />
      </main>
      <Footer />
    </div>
  );
}
