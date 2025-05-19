import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { RiAddLine } from "react-icons/ri";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add Project Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-48 rounded-xl border-2 border-dashed border-[#404040] flex items-center justify-center text-[#e5e5e5]/60 hover:border-[#f59e0b] hover:text-[#f59e0b] transition-colors group"
        >
          <div className="text-center">
            <RiAddLine className="text-3xl mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span>Create New Project</span>
          </div>
        </motion.button>

        {/* Project cards will be mapped here */}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
