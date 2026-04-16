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
import WithdrawalAddresses from "./pages/WithdrawalAddresses";
import PayVendorTelegram from "./pages/PayvendorTelegram";
import PayVendor from "./pages/PayVendor";
import BuyAirtime from "./pages/BuyAirtime";
import PayBills from "./pages/PayBills";
import DataTopup from "./pages/DataTopup";
import Deposit from "./pages/Deposit";
import OnRamp from "./pages/OnRamp";
import OnRampHistory from "./pages/OnRampHistory";
import OnRampDetail from "./pages/OnRampDetail";
import Withdraw from "./pages/Withdraw";
import P2PSend from "./pages/P2PSend";
import KYC from "./pages/KYC";
import Remittance from "./pages/Remittance";
import Invoices from "./pages/Invoices";
import LinkAccount from "./pages/LinkAccount";
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
              <Route path="/link-account" element={<ProtectedRoute><LinkAccount /></ProtectedRoute>} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/withdrawal-addresses" element={<ProtectedRoute><WithdrawalAddresses /></ProtectedRoute>} />
              <Route path="/pay-vendor" element={<ProtectedRoute><PayVendor /></ProtectedRoute>} />
              <Route path="/buy-airtime" element={<ProtectedRoute><BuyAirtime /></ProtectedRoute>} />
              <Route path="/pay-bills" element={<ProtectedRoute><PayBills /></ProtectedRoute>} />
              <Route path="/data-topup" element={<ProtectedRoute><DataTopup /></ProtectedRoute>} />
              <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
              <Route path="/on-ramp" element={<ProtectedRoute><OnRamp /></ProtectedRoute>} />
              <Route path="/on-ramp/history" element={<ProtectedRoute><OnRampHistory /></ProtectedRoute>} />
              <Route path="/on-ramp/:requestId" element={<ProtectedRoute><OnRampDetail /></ProtectedRoute>} />
              <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
              <Route path="/send" element={<ProtectedRoute><P2PSend /></ProtectedRoute>} />
              <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
              <Route path="/remittance" element={<ProtectedRoute><Remittance /></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
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
