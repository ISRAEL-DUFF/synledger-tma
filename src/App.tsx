import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "@/hooks/useNotifications";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Services from "./pages/Services";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Wallet from "./pages/Wallet";
import Settings from "./pages/Settings";
import PayVendorTelegram from "./pages/PayvendorTelegram";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/tg/pay-vendor" element={<PayVendorTelegram />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
