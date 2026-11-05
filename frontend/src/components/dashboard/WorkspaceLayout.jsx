import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LoadingState } from "@/components/shared/PageState";

// Keep sidebar state and animations alive through auth, chunks and data loading.
export default function WorkspaceLayout() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingState />}>
        <ProtectedRoute>
          <Outlet />
        </ProtectedRoute>
      </Suspense>
    </DashboardLayout>
  );
}
