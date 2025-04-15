import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import Dashboard from "@/pages/dashboard";
import Schedules from "@/pages/schedules";
import Teams from "@/pages/teams";
import Volunteers from "@/pages/volunteers";
import SwapRequests from "@/pages/swap-requests";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { useState } from "react";

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        
        <main className="flex-1 overflow-y-auto bg-neutral-50 pt-0 md:pt-0">
          <MobileHeader onMenuToggle={toggleMobileMenu} />
          <div className="md:hidden h-16"></div>
          
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/schedules" component={Schedules} />
            <Route path="/teams" component={Teams} />
            <Route path="/volunteers" component={Volunteers} />
            <Route path="/swap-requests" component={SwapRequests} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
