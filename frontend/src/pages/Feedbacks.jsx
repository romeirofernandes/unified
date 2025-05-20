import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RiArrowLeftLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/dashboard/DashboardLayout";

const Feedbacks = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectAndFeedbacks = async () => {
      try {
        // Fetch project details
        const projectRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/projects/${projectId}`,
          {
            headers: {
              "firebase-uid": user.uid,
            },
          }
        );

        if (!projectRes.ok) throw new Error("Project not found");
        const projectData = await projectRes.json();
        setProject(projectData);

        // Fetch feedbacks
        const feedbackRes = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/feedback/project/${projectId}`,
          {
            headers: {
              "firebase-uid": user.uid,
            },
          }
        );

        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          setFeedbacks(feedbackData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && user) {
      fetchProjectAndFeedbacks();
    }
  }, [projectId, user]);

  if (loading) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg hover:bg-[#404040] transition-colors"
            >
              <RiArrowLeftLine size={20} />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold">{project?.name}</h1>
              <p className="text-[#e5e5e5]/60">{feedbacks.length} responses</p>
            </div>
          </div>
        </div>

        {/* Feedbacks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedbacks.map((feedback) => (
            <motion.div
              key={feedback._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-[#262626] border border-[#404040] space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#e5e5e5]/40">
                  {new Date(feedback.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="space-y-3">
                {Object.entries(feedback.formAnswers).map(([key, value]) => {
                  const field = project.fields.find((f) => f._id === key);
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-sm text-[#e5e5e5]/40">
                        {field?.label}
                      </label>
                      <p className="text-[#e5e5e5]">{value}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {feedbacks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#e5e5e5]/40">No feedback received yet</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Feedbacks;
