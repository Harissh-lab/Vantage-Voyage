import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import EventDetails from "@/pages/EventDetails";

// Guest Flow
import GuestLookup from "@/pages/guest/GuestLookup";
import GuestTravel from "@/pages/guest/GuestTravel";
import GuestConcierge from "@/pages/guest/GuestConcierge";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login handled by use-auth hook logic or simple redirect
    window.location.href = "/api/login";
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Landing} />
      
      {/* Protected Agent/Client Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/events/:id">
        {() => <ProtectedRoute component={EventDetails} />}
      </Route>

      {/* Guest Flow Routes (Public with Ref) */}
      <Route path="/guest" component={GuestLookup} />
      <Route path="/guest/travel" component={GuestTravel} />
      <Route path="/guest/concierge" component={GuestConcierge} />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
