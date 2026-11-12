import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WorkspaceLayout from "./components/dashboard/WorkspaceLayout";
import RouteLoading from "./components/shared/RouteLoading";
import Landing from "./pages/Landing";

const DigestPrototypes = lazy(() => import("./prototypes/digest/DigestPrototypes"));

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Feedbacks = lazy(() => import("./pages/Feedbacks"));
const Workbench = lazy(() => import("./pages/Workbench"));
const PullRequests = lazy(() => import("./pages/PullRequests"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Settings = lazy(() => import("./pages/Settings"));
const Docs = lazy(() => import("./pages/Docs"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/prototypes/digest" element={<DigestPrototypes />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<WorkspaceLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/project/:projectId/feedbacks"
              element={<Feedbacks />}
            />
            <Route path="/dashboard/workbench" element={<Workbench />} />
            <Route path="/dashboard/pull-requests" element={<PullRequests />} />
            <Route path="/dashboard/integrations" element={<Integrations />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/docs" element={<Docs />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
