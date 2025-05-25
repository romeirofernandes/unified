import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import ProjectModal from "../components/dashboard/ProjectModal";
import ProjectPreview from "../components/dashboard/ProjectPreview";
import { motion } from "framer-motion";
import { RiAddLine, RiDeleteBin6Line } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectFeedbacks, setProjectFeedbacks] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateProject = async (projectData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "firebase-uid": user.uid,
          },
          body: JSON.stringify(projectData),
        }
      );

      if (response.ok) {
        const newProject = await response.json();
        setProjects([...projects, newProject]);
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const fetchProjectFeedbacks = async (projectId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/feedback/project/${projectId}`,
        {
          headers: {
            "firebase-uid": user.uid,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setProjectFeedbacks((prev) => ({
          ...prev,
          [projectId]: data,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/projects`,
          {
            headers: {
              "firebase-uid": user.uid,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
          // Fetch feedbacks for each project
          data.forEach((project) => fetchProjectFeedbacks(project._id));
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };

    fetchProjects();
  }, [user]);

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setIsPreviewOpen(true);
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation(); // Prevent triggering the card click
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            "firebase-uid": user.uid,
          },
        }
      );

      if (response.ok) {
        setProjects(projects.filter((p) => p._id !== projectId));
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleCardClick = (projectId) => {
    navigate(`/project/${projectId}/feedbacks`);
  };

  return (
    <DashboardLayout>
      <div className="mb-6 sm:mb-8 pt-4 sm:pt-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[#fafafa]">
          yo, {user?.email?.split("@")[0] || "there"} 👋
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Add Project Card */}
        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-40 sm:h-48 rounded-lg border-2 border-dashed border-[#383838] flex items-center justify-center text-[#a1a1a1] hover:border-[#737373] hover:text-[#737373] transition-colors group"
        >
          <div className="text-center">
            <RiAddLine className="text-2xl sm:text-3xl mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm sm:text-base">Create New Project</span>
          </div>
        </motion.button>

        {/* Project Cards */}
        {projects.map((project) => (
          <motion.div
            key={project._id}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleCardClick(project._id)}
            className="relative h-40 sm:h-48 rounded-lg bg-[#191919] border border-[#383838] p-4 sm:p-6 flex flex-col justify-between cursor-pointer"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={(e) => handleDeleteProject(project._id, e)}
              className="absolute top-2 right-2 p-1.5 sm:p-2 bg-[#262626] rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <RiDeleteBin6Line size={14} className="sm:w-4 sm:h-4" />
            </motion.button>

            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 text-[#fafafa] pr-8">
                {project.name}
              </h3>
              <p className="text-[#a1a1a1] text-xs sm:text-sm line-clamp-2">
                {project.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <span className="text-xs sm:text-sm text-[#a1a1a1]">
                  {project.fields.length} fields
                </span>
                <span className="text-xs sm:text-sm text-[#a1a1a1]">
                  {projectFeedbacks[project._id]?.length || 0} responses
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleProjectClick(project);
                }}
                className="px-2 sm:px-3 py-1 rounded-lg text-xs bg-[#737373] text-[#fafafa] hover:bg-[#525252] transition-colors self-start sm:self-auto"
              >
                Preview
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      <ProjectPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        project={selectedProject}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
