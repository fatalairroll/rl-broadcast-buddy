import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import Creator from "./pages/Creator";
import Admin from "./pages/Admin";
import Relay from "./pages/Relay";
import Studio from "./pages/Studio";
import StudioRender from "./pages/StudioRender";
import OverlayV2 from "./pages/OverlayV2";
import PlayersRegistryAdmin from "./pages/PlayersRegistryAdmin";
import NotFound from "./pages/NotFound";
import OperatorLayout from "./components/layout/OperatorLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/creator" replace />} />
            <Route path="/dashboard" element={<Navigate to="/creator" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<OperatorLayout />}>
              <Route path="/creator" element={<Creator />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/relay" element={<Relay />} />
              <Route path="/studio" element={<Studio />} />
              <Route path="/v2/admin/players" element={<PlayersRegistryAdmin />} />
            </Route>
            <Route path="/studio/render" element={<StudioRender />} />
            <Route path="/v2/overlay" element={<OverlayV2 />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
