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
import EventSetup from "@/pages/EventSetup";
import EventPreview from "@/pages/EventPreview";
import GuestImport from "@/pages/GuestImport";
import ApprovalReview from "@/pages/ApprovalReview";

// Auth Pages
import AgentSignIn from "@/pages/auth/AgentSignIn";
import AgentSignUp from "@/pages/auth/AgentSignUp";
import ClientSignIn from "@/pages/auth/ClientSignIn";
import ClientSignUp from "@/pages/auth/ClientSignUp";

// Guest Flow
import GuestLookup from "@/pages/guest/GuestLookup";
import GuestDashboard from "@/pages/guest/GuestDashboard";
import GuestBleisure from "@/pages/guest/GuestBleisure";
import GuestTravel from "@/pages/guest/GuestTravel";
import GuestConcierge from "@/pages/guest/GuestConcierge";
import GuestIDVault from "@/pages/guest/GuestIDVault";
import GuestItinerary from "@/pages/guest/GuestItinerary";
import GuestRoomUpgrade from "@/pages/guest/GuestRoomUpgrade";
import { Redirect } from "wouter";

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
    return <Redirect to="/" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Landing} />
      
      {/* Auth Routes */}
      <Route path="/auth/agent/signin" component={AgentSignIn} />
      <Route path="/auth/agent/signup" component={AgentSignUp} />
      <Route path="/auth/client/signin" component={ClientSignIn} />
      <Route path="/auth/client/signup" component={ClientSignUp} />
      
      {/* Protected Agent/Client Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/events/:id">
        {() => <ProtectedRoute component={EventDetails} />}
      </Route>
      <Route path="/events/:id/setup">
        {() => <ProtectedRoute component={EventSetup} />}
      </Route>
      <Route path="/events/:id/preview">
        {() => <ProtectedRoute component={EventPreview} />}
      </Route>
      <Route path="/events/:id/approval">
        {() => <ProtectedRoute component={ApprovalReview} />}
      </Route>
      <Route path="/events/:id/guests/import">
        {() => <ProtectedRoute component={GuestImport} />}
      </Route>

      {/* Guest Flow Routes (Public with Token) */}
      <Route path="/guest/:token">
        {(params) => <GuestDashboard />}
      </Route>
      <Route path="/guest/:token/bleisure">
        {(params) => <GuestBleisure token={params.token} />}
      </Route>
      <Route path="/guest/:token/travel">
        {(params) => <GuestTravel token={params.token} />}
      </Route>
      <Route path="/guest/:token/concierge">
        {(params) => <GuestConcierge token={params.token} />}
      </Route>
      <Route path="/guest/:token/idvault">
        {(params) => <GuestIDVault token={params.token} />}
      </Route>
      <Route path="/guest/:token/itinerary">
        {(params) => <GuestItinerary token={params.token} />}
      </Route>
      <Route path="/guest/:token/room-upgrade">
        {(params) => <GuestRoomUpgrade token={params.token} />}
      </Route>
      <Route path="/guest" component={GuestLookup} />

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
