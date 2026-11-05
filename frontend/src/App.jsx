import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { LoadingState } from "./components/shared/PageState";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Feedbacks = lazy(() => import("./pages/Feedbacks"));
const Settings = lazy(() => import("./pages/Settings"));
const Docs = lazy(() => import("./pages/Docs"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthLayout = lazy(() => import("./components/auth/AuthLayout"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="min-h-svh bg-background p-8 text-foreground">
            <LoadingState />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/docs" element={<Docs />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              element={
                <ProtectedRoute>
                  <Outlet />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/project/:projectId/feedbacks"
                element={<Feedbacks />}
              />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/dashboard/docs" element={<Docs />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
