// main app component with routing and auth
import { Toaster } from "./toaster";
import { Toaster as Sonner } from "./sonner";
import { TooltipProvider } from "./tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthForm } from "./AuthForm";
import { AppLayout } from "./AppLayout";
import Index from "./Index";
import History from "./History";
import Settings from "./Settings";
import NotFound from "./NotFound";
import { Loader2 } from "lucide-react";

// create query client for react-query
const queryClient = new QueryClient();

// inner app component that uses auth context
function AppContent() {
  const { user, isLoading } = useAuth();

  // show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // show auth form if not logged in
  if (!user) {
    return <AuthForm />;
  }

  // show main app if logged in
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        {/* catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  );
}

// main app component with providers
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
