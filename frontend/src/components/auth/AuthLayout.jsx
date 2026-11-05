import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

export default function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
