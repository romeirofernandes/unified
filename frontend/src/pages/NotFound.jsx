import { Link } from "react-router-dom";
import Brand from "@/components/shared/Brand";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-5 text-foreground">
      <Brand />
      <div className="max-w-md text-center">
        <PageHeader
          title="This page wandered off."
          description="The link may have changed, or the page no longer exists."
        />
      </div>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </main>
  );
}
