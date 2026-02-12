import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Ads from "@/pages/Ads";
import Trivia from "@/pages/Trivia";
import Music from "@/pages/Music";
import Admin from "@/pages/Admin";
import Games from "@/pages/Games";
import { AudioProvider } from "@/contexts/AudioContext";
import MiniPlayer from "@/components/MiniPlayer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ads" component={Ads} />
      <Route path="/trivia" component={Trivia} />
      <Route path="/music" component={Music} />
      <Route path="/games" component={Games} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const showMiniPlayer = location !== "/music" && location !== "/admin";

  return (
    <>
      <Router />
      {showMiniPlayer && <MiniPlayer />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AudioProvider>
          <Toaster />
          <AppContent />
        </AudioProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
