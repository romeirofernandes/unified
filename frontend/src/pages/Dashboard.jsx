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

  // Add this function to fetch feedbacks for each project
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

  // Add this function to handle project deletion
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add Project Card */}
        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-48 rounded-xl border-2 border-dashed border-[#404040] flex items-center justify-center text-[#e5e5e5]/60 hover:border-[#f59e0b] hover:text-[#f59e0b] transition-colors group"
        >
          <div className="text-center">
            <RiAddLine className="text-3xl mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span>Create New Project</span>
          </div>
        </motion.button>

        {/* Project Cards */}
        {projects.map((project) => (
          <motion.div
            key={project._id}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleCardClick(project._id)}
            className="relative h-48 rounded-xl bg-[#262626] border border-[#404040] p-6 flex flex-col justify-between cursor-pointer"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={(e) => handleDeleteProject(project._id, e)}
              className="absolute top-2 right-2 p-2 bg-[#171717] rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
            >
              <RiDeleteBin6Line size={16} />
            </motion.button>

            <div>
              <h3 className="text-xl font-bold mb-2">{project.name}</h3>
              <p className="text-[#e5e5e5]/60 text-sm line-clamp-2">
                {project.description}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-[#e5e5e5]/40">
                  {project.fields.length} fields
                </span>
                <span className="text-sm text-[#e5e5e5]/40">
                  {projectFeedbacks[project._id]?.length || 0} responses
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleProjectClick(project);
                }}
                className="px-3 py-1 rounded-full text-xs bg-[#f59e0b] text-black hover:bg-[#92400e] hover:text-[#fde68a] transition-colors"
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
