import { useLocation } from "react-router-dom";
import Quickstart from "@/components/docs/Quickstart";
import Navbar from "@/components/landing/Navbar";

export default function Docs() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/dashboard")) return <Quickstart />;
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Navbar />
      <main className="mx-auto flex min-h-0 w-full max-w-[1296px] flex-1 flex-col px-5 py-8 sm:px-8 lg:px-12">
        <Quickstart />
      </main>
    </div>
  );
}
