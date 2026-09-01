import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
const MarketplacePage = lazy(() => import("@/pages/service/MarketplacePage").then((module) => ({ default: module.MarketplacePage })));
const ServiceAuthPage = lazy(() => import("@/pages/service/ServiceAuthPage").then((module) => ({ default: module.ServiceAuthPage })));
const ServiceRequestPage = lazy(() => import("@/pages/service/ServiceRequestPage").then((module) => ({ default: module.ServiceRequestPage })));
const CustomerRequestsPage = lazy(() => import("@/pages/service/CustomerRequestsPage").then((module) => ({ default: module.CustomerRequestsPage })));
const ServiceOwnerPage = lazy(() => import("@/pages/service/ServiceOwnerPage").then((module) => ({ default: module.ServiceOwnerPage })));
const ProviderPortalPage = lazy(() => import("@/pages/service/ProviderPortalPage").then((module) => ({ default: module.ProviderPortalPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

function LoadingScreen() {
  return <div className="min-h-[100dvh] grid place-items-center bg-[#fbfaf6]" dir="rtl"><div className="flex items-center gap-3 text-primary font-bold"><Loader2 className="animate-spin" />جاري التحميل...</div></div>;
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" richColors closeButton />
      <BrowserRouter>
        <AuthProvider>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/" element={<MarketplacePage />} />
                  <Route path="/auth" element={<ServiceAuthPage />} />
                  <Route path="/request/new" element={<ServiceRequestPage />} />
                  <Route path="/requests" element={<Protected><CustomerRequestsPage /></Protected>} />
                  <Route path="/provider" element={<Protected><ProviderPortalPage /></Protected>} />
                  <Route path="/owner" element={<Protected><ServiceOwnerPage /></Protected>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
