import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ThemeProvider from "./context/ThemeContext";
import MagneticCursor from "./effects/MagneticCursor";
import Loader from "./components/Loader";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Workspaces = lazy(() => import("./pages/Workspaces"));
const WorkspaceDashboard = lazy(() => import("./pages/WorkspaceDashboard"));

function AuthGuard({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
};

const MotionPage = ({ children }) => (
  <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.3, ease: "easeOut" }}>
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MotionPage><Landing /></MotionPage>} />
        <Route path="/login" element={<MotionPage><Login /></MotionPage>} />
        <Route path="/signup" element={<MotionPage><Signup /></MotionPage>} />
        <Route path="/dashboard" element={<MotionPage><AuthGuard><Dashboard /></AuthGuard></MotionPage>} />
        <Route path="/dashboard/:view" element={<MotionPage><AuthGuard><Dashboard /></AuthGuard></MotionPage>} />
        <Route path="/workspaces" element={<MotionPage><AuthGuard><Workspaces /></AuthGuard></MotionPage>} />
        <Route path="/workspaces/:id" element={<MotionPage><AuthGuard><WorkspaceDashboard /></AuthGuard></MotionPage>} />
        <Route path="/admin" element={<MotionPage><AuthGuard><Admin /></AuthGuard></MotionPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <MagneticCursor />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center animated-bg"><Loader text="Loading..." /></div>}>
          <AnimatedRoutes />
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}
