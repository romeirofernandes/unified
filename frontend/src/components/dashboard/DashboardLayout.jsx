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
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarInsetTopbar } from "@/components/sidebar-app/inset-topbar";
import { Button } from "@/components/ui/button";
import Brand from "@/components/shared/Brand";
import { ErrorMessage } from "@/components/shared/PageState";
import ThemeToggle from "@/components/landing/ThemeToggle";
import { typeClass } from "@/lib/type-scale";

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
      <SidebarMenu>
        {navigation.map(({ path, label, icon }) => {
          const active =
            path === "/dashboard"
              ? pathname === path || pathname.startsWith("/project/")
              : pathname.startsWith(path);
          return (
            <SidebarMenuItem key={path}>
              <SidebarMenuButton
                isActive={active}
                render={
                  <Link
                    to={path}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpenMobile(false)}
                  />
                }
              >
                <HugeiconsIcon icon={icon} size={18} aria-hidden="true" />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
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
    )?.label || "Projects";

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
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
            loading={signingOut}
          >
            <HugeiconsIcon icon={LogOutIcon} size={18} aria-hidden="true" />
            Sign out
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <SidebarInsetTopbar className="sticky top-0 z-20 h-16 border-b border-border bg-background/95 px-4 backdrop-blur-xl sm:px-6">
          <span className={`${typeClass("body")} text-muted-foreground`}>
            Workspace / <span className="text-foreground">{title}</span>
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </SidebarInsetTopbar>
        <div
          id="workspace-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1400px] space-y-7 p-5 outline-none sm:p-8 lg:p-10"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
