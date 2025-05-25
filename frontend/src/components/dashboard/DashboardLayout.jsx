import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  RiDashboardLine,
  RiSettingsLine,
  RiLogoutBoxLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiMenu4Line,
  RiCloseLine,
} from "react-icons/ri";
import { useNavigate, useLocation, Link } from "react-router-dom";

const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      {/* Desktop Sidebar */}
      <motion.div
        initial={{ width: "256px" }}
        animate={{ width: isCollapsed ? "80px" : "256px" }}
        className="fixed left-0 top-0 h-full bg-[#191919] border-r border-[#383838] flex-col hidden lg:flex"
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-[#383838]">
          {!isCollapsed && (
            <h1 className="text-2xl font-bold text-[#737373]">Unified</h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
          >
            {isCollapsed ? <RiMenuUnfoldLine /> : <RiMenuFoldLine />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
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
                      ? "bg-[#262626] text-[#737373]"
                      : "hover:bg-[#262626] text-[#e5e5e5]"
                  }
                `}
              >
                <Icon size={20} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#383838]">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#262626] transition-colors text-red-500 w-full"
          >
            <RiLogoutBoxLine size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#191919] border-b border-[#383838] px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#737373]">Unified</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? (
            <RiCloseLine size={24} />
          ) : (
            <RiMenu4Line size={24} />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isMobileMenuOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="lg:hidden fixed left-0 top-0 h-full w-64 bg-[#191919] border-r border-[#383838] flex flex-col z-50"
      >
        {/* Mobile Header */}
        <div className="p-4 border-b border-[#383838]">
          <h1 className="text-2xl font-bold text-[#737373]">Unified</h1>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center space-x-2 p-3 rounded-lg transition-colors
                  ${
                    isActivePath(item.path)
                      ? "bg-[#262626] text-[#737373]"
                      : "hover:bg-[#262626] text-[#e5e5e5]"
                  }
                `}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Logout Button */}
        <div className="p-4 border-t border-[#383838]">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#262626] transition-colors text-red-500 w-full"
          >
            <RiLogoutBoxLine size={20} />
            <span>Logout</span>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        animate={{
          marginLeft:
            window.innerWidth >= 1024
              ? isCollapsed
                ? "80px"
                : "256px"
              : "0px",
          paddingTop: window.innerWidth >= 1024 ? "0px" : "70px",
        }}
        className="p-4 sm:p-6 lg:p-8"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default DashboardLayout;
