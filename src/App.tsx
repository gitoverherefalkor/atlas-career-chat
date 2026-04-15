
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Loader2 } from "lucide-react";

// Eagerly load the landing page and global components
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { ChunkLoadErrorBoundary } from "./components/ChunkLoadErrorBoundary";

// Hidden V2 landing page preview (charcoal palette) — not linked from anywhere
const IndexV2 = lazy(() => import("./pages/IndexV2"));

// Lazy load all other routes — only downloaded when the user navigates to them
const PaymentSuccess = lazy(() => import("./components/PaymentSuccess"));
const Assessment = lazy(() => import("./pages/Assessment"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthConfirm = lazy(() => import("./pages/AuthConfirm"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Chat = lazy(() => import("./pages/Chat"));
const Report = lazy(() => import("./pages/Report"));
const ReportProcessing = lazy(() => import("./pages/ReportProcessing"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Support = lazy(() => import("./pages/Support"));
const Payment = lazy(() => import("./pages/Payment"));
const ColorTest = lazy(() => import("./pages/ColorTest"));
const Jobs = lazy(() => import("./pages/Jobs"));

// Loading fallback shown while lazy chunks are downloading
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Loader2 className="h-8 w-8 animate-spin text-atlas-blue" />
  </div>
);

const queryClient = new QueryClient();

// Syncs i18next language with the user's Supabase profile preference
const LanguageSync = ({ children }: { children: React.ReactNode }) => {
  useLanguage();
  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageSync>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ChunkLoadErrorBoundary>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/v2" element={<IndexV2 />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/confirm" element={<AuthConfirm />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/assessment" element={<Assessment />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/report" element={<Report />} />
              <Route path="/report-processing" element={<ReportProcessing />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/support" element={<Support />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/color-test" element={<ColorTest />} />
              <Route path="/jobs" element={<Jobs />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </ChunkLoadErrorBoundary>
          <CookieConsentBanner />
        </BrowserRouter>
      </TooltipProvider>
      </LanguageSync>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
