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
import Requests from "@/pages/requests";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import { useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";

function AuthenticatedApp() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/schedules" component={Schedules} />
      <Route path="/volunteers" component={Volunteers} />
      <Route path="/teams" component={Teams} />
      <Route path="/events" component={Events} />
      <Route path="/requests" component={Requests} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/:any*" component={() => <Login />} />
      </Switch>
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
