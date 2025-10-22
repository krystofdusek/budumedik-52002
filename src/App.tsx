import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TestGenerators from "./pages/dashboard/TestGenerators";
import Progress from "./pages/dashboard/Progress";
import Settings from "./pages/dashboard/Settings";
import Test from "./pages/Test";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminReported from "./pages/admin/AdminReported";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/tests" element={<TestGenerators />} />
          <Route path="/dashboard/progress" element={<Progress />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="/test" element={<Test />} />
            <Route path="/admin/questions" element={<AdminQuestions />} />
            <Route path="/admin/reported" element={<AdminReported />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
