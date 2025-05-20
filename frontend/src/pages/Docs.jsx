import React from "react";
import { motion } from "framer-motion";
import { RiArrowRightLine } from "react-icons/ri";

const steps = [
  {
    title: "Create a Project",
    description: "Start by creating a new project in your dashboard.",
    steps: [
      "Login to your dashboard",
      "Click 'Create New Project' button",
      "Add your project title and description",
      "Choose a theme (light/dark)",
      "Create form fields (email is required by default)",
    ],
    image: "/create-project.png",
  },
  {
    title: "Install SDK",
    description: "Add the Unified SDK to your project.",
    steps: [
      "Open your terminal",
      "Navigate to your project",
      "Run the install command:",
    ],
    code: "npm install unified-sdk",
    image: "/install-sdk.png",
  },
  {
    title: "Add Component",
    description:
      "Copy the integration code from project preview and add it to your app.",
    code: `import { UnifiedFeedback } from 'unified-sdk';

function App() {
  return (
    <UnifiedFeedback 
      projectId={import.meta.env.VITE_PROJECT_ID}
      firebaseUid={import.meta.env.VITE_FIREBASE_UID}
      theme="light"
    />
  );
}
  
export default App;`,
    image: "/integration-code.png",
  },
  {
    title: "View Feedback",
    description: "Check responses and generate AI summaries.",
    steps: [
      "Go to your project in the dashboard",
      "Click 'View Responses' to see all feedback",
      "Use 'Generate Summary' for AI analysis",
    ],
    image: "/view-feedback.png",
  },
];

const Docs = () => {
  return (
    <div className="min-h-screen bg-[#171717] text-[#fafafa]">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-4 pb-8 border-b border-[#383838]">
            <h1 className="text-4xl font-bold">Documentation</h1>
            <p className="text-[#a1a1a1] text-lg">
              Follow these simple steps to integrate Unified in your project
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* Content */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">
                    {index + 1}. {step.title}
                  </h2>
                  <p className="text-[#a1a1a1]">{step.description}</p>

                  {step.steps && (
                    <ul className="space-y-2">
                      {step.steps.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <RiArrowRightLine className="mt-1 flex-shrink-0 text-[#737373]" />
                          <span className="text-[#a1a1a1]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {step.code && (
                    <pre className="bg-[#262626] p-4 rounded-lg overflow-x-auto border border-[#383838]">
                      <code className="text-[#a1a1a1]">{step.code}</code>
                    </pre>
                  )}
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-[#191919] rounded-lg flex flex-col justify-center items-center border border-[#383838] overflow-hidden"
                >
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-auto h-auto object-center"
                    loading="lazy"
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Docs;
