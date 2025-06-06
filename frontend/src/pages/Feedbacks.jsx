import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RiArrowLeftLine, RiFileTextLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/dashboard/DashboardLayout";

const Feedbacks = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const LOCAL_STORAGE_KEY = `feedback-summary-${projectId}`;

  const [project, setProject] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [isSummarizing, setIsSummarizing] = useState(false);

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

  const generateSummary = async () => {
    setIsSummarizing(true);
    try {
      // Format feedback data for Gemini
      const formattedData = {
        questions: project.fields.map((f) => f.label),
        responses: feedbacks.map((f) => ({
          timestamp: new Date(f.timestamp).toLocaleString(),
          answers: Object.entries(f.formAnswers).map(([key, value]) => {
            const field = project.fields.find((f) => f._id === key);
            return { question: field?.label, answer: value };
          }),
        })),
      };

      const prompt = `Analyze this feedback data and provide a structured response in exactly this format:

TLDR:
[Provide a 2-3 line summary of the overall feedback]

KEY FEATURES TO IMPROVE/ADD:
• [Feature 1] - [Brief explanation]
• [Feature 2] - [Brief explanation]
• [Feature 3] - [Brief explanation]
[Add more if needed, each on a new line with bullet point]

Only include these two sections. Keep it concise and actionable. If there's not enough data, mention that in the TLDR.

Feedback Data:
Questions:
${formattedData.questions.join("\n")}

Responses:
${JSON.stringify(formattedData.responses, null, 2)}`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": import.meta.env.VITE_GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await response.json();

      const parsedSummary = {
        timestamp: new Date().toISOString(),
        tldr: data.candidates[0].content.parts[0].text
          .split("TLDR:")[1]
          .split("KEY FEATURES")[0]
          .trim(),
        features: data.candidates[0].content.parts[0].text
          .split("KEY FEATURES TO IMPROVE/ADD:")[1]
          .split("\n")
          .filter((line) => line.trim().startsWith("•"))
          .map((feature) => feature.trim()),
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsedSummary));
      setSummary(parsedSummary);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  useEffect(() => {
    return () => {};
  }, []);

  if (loading) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 mt-4 sm:mt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg hover:bg-[#262626] transition-colors text-[#a1a1a1]"
            >
              <RiArrowLeftLine size={20} />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-[#fafafa]">
                {project?.name}
              </h1>
              <p className="text-[#a1a1a1]">{feedbacks.length} responses</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={generateSummary}
            disabled={isSummarizing || feedbacks.length === 0}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg
              ${
                feedbacks.length === 0
                  ? "bg-[#262626] cursor-not-allowed opacity-50"
                  : "bg-[#737373] hover:bg-[#525252] text-[#fafafa]"
              }
              transition-colors
            `}
          >
            <RiFileTextLine />
            <span>{isSummarizing ? "Generating..." : "Generate Summary"}</span>
          </motion.button>
        </div>

        {/* Summary Section */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-lg bg-[#191919] border border-[#383838] space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2 text-[#fafafa]">
                AI Analysis
              </h3>
              <span className="text-xs text-[#a1a1a1]">
                Generated {new Date(summary.timestamp).toLocaleString()}
              </span>
            </div>

            {/* TLDR Section */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[#737373] uppercase tracking-wider">
                TLDR
              </h4>
              <div className="p-4 rounded-lg bg-[#262626] border border-[#383838]">
                <p className="text-sm text-[#a1a1a1] leading-relaxed">
                  {summary.tldr}
                </p>
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[#737373] uppercase tracking-wider">
                Key Features to Improve/Add
              </h4>
              <div className="grid gap-3">
                {summary.features.map((feature, index) => {
                  const featureText = feature.replace("• ", "");
                  const boldPart = featureText.match(/\*\*(.*?)\*\*/)?.[1];
                  const remainingText = featureText.replace(
                    /\*\*(.*?)\*\*/,
                    ""
                  );

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-[#262626] border border-[#383838] hover:border-[#525252] transition-colors group"
                    >
                      <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-[#737373]" />
                      <p className="text-sm text-[#a1a1a1] leading-relaxed group-hover:text-[#fafafa]">
                        {boldPart ? (
                          <>
                            <b>{boldPart}</b>
                            {remainingText}
                          </>
                        ) : (
                          featureText
                        )}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Feedbacks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedbacks.map((feedback) => (
            <motion.div
              key={feedback._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-lg bg-[#191919] border border-[#383838] space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#a1a1a1]">
                  {new Date(feedback.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="space-y-3">
                {Object.entries(feedback.formAnswers).map(([key, value]) => {
                  const field = project.fields.find((f) => f._id === key);
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-sm text-[#a1a1a1]">
                        {field?.label}
                      </label>
                      <p className="text-[#fafafa]">{value}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {feedbacks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#a1a1a1]">No feedback received yet</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Feedbacks;
