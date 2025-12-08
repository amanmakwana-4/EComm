import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Configure QueryClient with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Keep unused data in cache for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
    },
  },
});

const routes = [
  { path: "/", Component: lazy(() => import("@/pages/Index")) },
  { path: "/product/", Component: lazy(() => import("@/pages/Product")) },
  { path: "/cart/", Component: lazy(() => import("@/pages/Cart")) },
  { path: "/checkout/", Component: lazy(() => import("@/pages/Checkout")) },
  { path: "/order-success/", Component: lazy(() => import("@/pages/OrderSuccess")) },
  { path: "/my-orders/", Component: lazy(() => import("@/pages/MyOrders")) },
  { path: "/about/", Component: lazy(() => import("@/pages/About")) },
  { path: "/contact/", Component: lazy(() => import("@/pages/Contact")) },
  { path: "/auth/", Component: lazy(() => import("@/pages/Auth")) },
  { path: "/admin/", Component: lazy(() => import("@/pages/Admin")) },
  { path: "/admin/login/", Component: lazy(() => import("@/pages/AdminLogin")) },
  { path: "*", Component: lazy(() => import("@/pages/NotFound")) },
];

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Loading page...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {routes.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Component />}></Route>
            ))}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

