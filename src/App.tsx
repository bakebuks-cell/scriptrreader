import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MarketMakerPage from "./pages/MarketMakerPage";
import PaymentPage from "./pages/PaymentPage";
import SuspendedPage from "./pages/SuspendedPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGuard({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, role, loading, sessionError } = useAuth();

  if (loading || (adminOnly && user && role === null)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" aria-busy="true">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Session was invalidated — redirect to auth with error info
  if (sessionError || !user) {
    const params = sessionError ? `?session_error=${sessionError.code}` : '';
    return <Navigate to={`/auth${params}`} replace />;
  }

  if (adminOnly && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (!adminOnly && role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<AuthGuard><UserDashboard /></AuthGuard>} />
              <Route path="/dashboard/*" element={<AuthGuard><UserDashboard /></AuthGuard>} />
              <Route path="/market-maker" element={<MarketMakerPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/suspended" element={<SuspendedPage />} />
              <Route path="/admin" element={<AuthGuard adminOnly><AdminDashboard /></AuthGuard>} />
              <Route path="/admin/*" element={<AuthGuard adminOnly><AdminDashboard /></AuthGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

