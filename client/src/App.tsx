import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Schedules from "@/pages/schedules";
import Volunteers from "@/pages/volunteers";
import Teams from "@/pages/teams";
import Events from "@/pages/events";
import Notifications from "@/pages/notifications";
import Settings from "@/pages/settings";
import { SidebarProvider } from "@/context/sidebar-context";
import { AuthProvider } from "@/contexts/AuthContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/schedules" component={Schedules}/>
      <Route path="/volunteers" component={Volunteers}/>
      <Route path="/teams" component={Teams}/>
      <Route path="/events" component={Events}/>
      <Route path="/notifications" component={Notifications}/>
      <Route path="/settings" component={Settings}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <Router />
          <Toaster />
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
