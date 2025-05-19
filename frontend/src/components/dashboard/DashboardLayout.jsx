import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  RiDashboardLine,
  RiSettingsLine,
  RiLogoutBoxLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] text-[#e5e5e5]">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-full w-64 bg-[#262626] border-r border-[#404040] p-6"
      >
        <h1 className="text-2xl font-bold text-[#f59e0b] mb-8">Unified</h1>

        <nav className="space-y-2">
          <a
            href="/dashboard"
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#404040] transition-colors"
          >
            <RiDashboardLine />
            <span>Projects</span>
          </a>
          <a
            href="/dashboard/settings"
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#404040] transition-colors"
          >
            <RiSettingsLine />
            <span>Settings</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#404040] transition-colors text-red-500 w-full text-left"
          >
            <RiLogoutBoxLine />
            <span>Logout</span>
          </button>
        </nav>
      </motion.div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-[#e5e5e5]/60">{user?.email}</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
