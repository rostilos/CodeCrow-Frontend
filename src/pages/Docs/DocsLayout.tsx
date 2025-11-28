import { Outlet, useNavigate } from "react-router-dom";
import { DocsSidebar } from "./DocsSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Code, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocsLayout() {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DocsSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10 min-h-[65px]">
            <div className="flex items-center justify-between p-3 h-full">
              <div className="flex items-center space-x-2">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold hidden sm:block">Documentation</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/projects")}>
                  <Code className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                  <Home className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
