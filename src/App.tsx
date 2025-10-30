import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PageLoader } from "@/components/PageLoader";
import { CookieConsent } from "@/components/CookieConsent";
import Home from "./pages/Home";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TestGenerators from "./pages/dashboard/TestGenerators";
import Progress from "./pages/dashboard/Progress";
import Settings from "./pages/dashboard/Settings";
import Leaderboard from "./pages/dashboard/Leaderboard";
import History from "./pages/dashboard/History";
import Test from "./pages/Test";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminReported from "./pages/admin/AdminReported";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBlog from "./pages/admin/AdminBlog";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {loading && <PageLoader />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/tests" element={<TestGenerators />} />
        <Route path="/dashboard/progress" element={<Progress />} />
        <Route path="/dashboard/history" element={<History />} />
        <Route path="/dashboard/leaderboard" element={<Leaderboard />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/test" element={<Test />} />
        <Route path="/admin/questions" element={<AdminQuestions />} />
        <Route path="/admin/reported" element={<AdminReported />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/blog" element={<AdminBlog />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieConsent />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
