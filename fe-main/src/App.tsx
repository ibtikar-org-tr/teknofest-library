import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/LanguageContext";
import NotFound from "@/pages/not-found";
import CompetitionsPage from "@/pages/Competitions";
import CompetitionDetail from "@/pages/CompetitionDetail";
import Resources from "@/pages/Resources";
import Calendar from "@/pages/Calendar";
import Chatbot from "@/pages/Chatbot";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CompetitionsPage} />
      <Route path="/competition/:id" component={CompetitionDetail} />
      <Route path="/resources" component={Resources} />
      <Route path="/dates" component={Calendar} />
      <Route path="/chatbot" component={Chatbot} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
