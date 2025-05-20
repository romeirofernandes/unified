import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  RiDashboardLine,
  RiSettingsLine,
  RiLogoutBoxLine,
  RiBookletLine,
} from "react-icons/ri";
import { useNavigate, useLocation, Link } from "react-router-dom";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActivePath = (path) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: "/dashboard", label: "Projects", icon: RiDashboardLine },
    { path: "/dashboard/docs", label: "Documentation", icon: RiBookletLine },
    { path: "/dashboard/settings", label: "Settings", icon: RiSettingsLine },
  ];

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
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-2 p-3 rounded-lg transition-colors
                  ${
                    isActivePath(item.path)
                      ? "bg-[#404040] text-[#f59e0b]"
                      : "hover:bg-[#404040] text-[#e5e5e5]"
                  }
                `}
              >
                <Icon />
                <span>{item.label}</span>
              </Link>
            );
          })}
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
      <div className="ml-64 p-8">{children}</div>
    </div>
  );
};

export default DashboardLayout;
