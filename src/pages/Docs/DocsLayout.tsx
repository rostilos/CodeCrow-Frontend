import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { DocsSidebar } from "./DocsSidebar";
import { TableOfContents } from "./TableOfContents";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect } from "react";
import { ROUTES } from "@/lib/routes";

export default function DocsLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full dashboard-theme bg-background">
        <DocsSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 w-full">
            <div className="h-[64px] flex items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1" />
                <span className="text-sm font-medium text-muted-foreground hidden sm:block">Documentation</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.WORKSPACE_SELECTION)}>
                  <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                  <Home className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Wrapper for Content and TOC */}
          <div className="flex-1 flex w-full">
            {/* Main Content */}
            <main className="flex-1 min-w-0 p-6 lg:p-12">
              <div className="max-w-4xl mx-auto">
                <Outlet />
              </div>
            </main>

            {/* Right Sidebar - TOC */}
            <TableOfContents />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
