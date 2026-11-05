import Brand from "./Brand";
import { LoadingState } from "./PageState";

export default function RouteLoading() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center px-5 sm:px-8">
        <Brand />
      </div>
      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8">
        <LoadingState />
      </div>
    </div>
  );
}
