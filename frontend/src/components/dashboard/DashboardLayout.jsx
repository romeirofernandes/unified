import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Settings01Icon,
  File01Icon,
  LogOutIcon,
} from "@hugeicons/core-free-icons";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { SharedLayoutBg } from "@/components/ui/shared-layout-bg";
import { SidebarInsetTopbar } from "@/components/sidebar-app/inset-topbar";
import { Button } from "@/components/ui/button";
import Brand from "@/components/shared/Brand";
import { ErrorMessage } from "@/components/shared/PageState";
import ThemeToggle from "@/components/landing/ThemeToggle";
import { typeClass } from "@/lib/type-scale";

function SignOutGlyph({ size }) {
  return <HugeiconsIcon icon={LogOutIcon} size={size} aria-hidden="true" />;
}

const navigation = [
  { path: "/dashboard", label: "Projects", icon: DashboardSquare01Icon },
  { path: "/dashboard/docs", label: "Documentation", icon: File01Icon },
  { path: "/dashboard/settings", label: "Settings", icon: Settings01Icon },
];

function WorkspaceNavigation() {
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  return (
    <nav aria-label="Workspace">
      <SharedLayoutBg as="ul" className="list-none gap-y-2 px-2" inset={8} pillClassName="rounded-md bg-[color-mix(in_oklab,var(--fluid-accent)_14%,transparent)] dark:bg-white/5">
        {navigation.map(({ path, label, icon }) => {
          const active =
            path === "/dashboard"
              ? pathname === path || pathname.startsWith("/project/")
              : pathname.startsWith(path);
          return (
            <li key={path}>
              <Link
                to={path}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpenMobile(false)}
                className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <HugeiconsIcon icon={icon} size={18} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </SharedLayoutBg>
    </nav>
  );
}

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const title =
    navigation.find(
      ({ path }) => path !== "/dashboard" && pathname.startsWith(path),
    )?.label || (pathname.startsWith("/project/") ? "Feedback" : "Projects");

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setError("Couldn’t sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SidebarProvider
      width="248px"
      className="min-h-svh bg-background text-foreground"
    >
      <a
        href="#workspace-content"
        className="sr-only z-50 rounded-lg bg-background p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Sidebar>
        <SidebarHeader className="px-4 py-6">
          <Brand />
        </SidebarHeader>
        <SidebarContent className="px-2">
          <WorkspaceNavigation />
        </SidebarContent>
        <SidebarFooter className="space-y-3 border-t border-border p-4">
          <div className="min-w-0">
            <p className={typeClass("body")}>
              {user?.displayName || "Your workspace"}
            </p>
            <p
              className={`${typeClass("caption")} truncate text-muted-foreground`}
              title={user?.email}
            >
              {user?.email}
            </p>
          </div>
          <ErrorMessage>{error}</ErrorMessage>
          <Button
            variant="destructive"
            leadingIcon={SignOutGlyph}
            className="w-full justify-start [&>span:nth-child(2)]:w-full [&>span:nth-child(2)]:justify-start"
            onClick={handleLogout}
            loading={signingOut}
          >
            Sign out
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <SidebarInsetTopbar className="sticky top-0 z-20 h-16 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="flex w-full items-center gap-2 px-0">
            <span className={`${typeClass("body")} text-muted-foreground`}>
              Workspace / <span className="text-foreground">{title}</span>
            </span>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </SidebarInsetTopbar>
        <div
          id="workspace-content"
          tabIndex={-1}
          className="w-full space-y-7 px-7 py-7 outline-none sm:px-8 sm:py-8 lg:px-8 lg:py-10"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
