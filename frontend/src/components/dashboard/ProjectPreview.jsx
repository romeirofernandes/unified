import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCloseLine, RiCodeLine, RiCheckLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";

const ProjectPreview = ({ isOpen, onClose, project }) => {
  const { user } = useAuth();
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const codeSnippet = 
`import { UnifiedFeedback } from "unified-sdk";
import "unified-sdk/dist/unified-sdk.css";

function App() {
  return (
    <UnifiedFeedback 
      projectId="${project?._id}"
      theme="${project?.theme}"
      firebaseUid="${user?.uid}"
    />
  );
}
  
export default App;`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderField = (field, theme) => {
    const baseInputClass = `w-full p-3 rounded-lg ${
      theme === "dark"
        ? "bg-[#262626] border border-[#383838] text-[#fafafa] placeholder-[#a1a1a1]"
        : "bg-[#fafafa] border border-[#e5e5e5] text-[#262626] placeholder-[#737373]"
    }`;

    switch (field.type) {
      case "text":
      case "email":
        return (
          <input
            type={field.type}
            className={baseInputClass}
            placeholder={field.label}
          />
        );
      case "textarea":
        return (
          <textarea
            className={`${baseInputClass} h-24 resize-none`}
            placeholder={field.label}
          />
        );
      case "mcq":
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`field-${field.label}`}
                  value={option.value}
                  className="text-[#e5e5e5]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );
      case "slider":
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={field.config?.min || 0}
              max={field.config?.max || 100}
              step={field.config?.step || 1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-[#e5e5e5]/70">
              <span>{field.config?.min || 0}</span>
              <span>{field.config?.max || 100}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="relative w-full max-w-7xl h-[90vh] bg-[#191919] rounded-lg border border-[#383838]"
          >
            {/* Header - Fixed */}
            <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-6 border-b border-[#383838] bg-[#191919] rounded-t-lg">
              <div>
                <h2 className="text-2xl font-bold text-[#fafafa]">
                  {project?.name}
                </h2>
                <p className="text-[#a1a1a1] text-sm">Preview & Integration</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-[#a1a1a1]"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            {/* Content Grid with Scrollable Columns */}
            <div className="grid grid-cols-2 h-[calc(90vh-5rem)] mt-20">
              {/* Preview Section - Scrollable */}
              <div className="border-r border-[#383838] p-6 pt-8 overflow-y-auto">
                <h3 className="font-medium text-[#fafafa] mb-6">Preview</h3>
                <div
                  className={`p-6 rounded-lg border ${
                    project?.theme === "dark"
                      ? "bg-[#262626] border-[#383838]"
                      : "bg-[#f8fafc] border-[#e5e5e5] shadow-sm"
                  }`}
                >
                  {project?.fields.map((field, index) => (
                    <div key={index} className="mb-4">
                      <label
                        className={`block mb-2 ${
                          project?.theme === "dark"
                            ? "text-[#fafafa]"
                            : "text-[#334155]"
                        }`}
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      {renderField(field, project?.theme)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Integration Section - Scrollable */}
              <div className="p-6 pt-8 overflow-y-auto">
                <h3 className="font-medium text-[#fafafa] mb-6">Integration</h3>
                <div className="space-y-4">
                  {/* Code Snippet */}
                  <div className="p-4 rounded-lg bg-[#262626] border border-[#383838] relative group">
                    <pre className="text-sm font-mono text-[#a1a1a1] overflow-x-auto">
                      <code>{codeSnippet}</code>
                    </pre>
                    <button
                      onClick={handleCopyCode}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-[#191919] hover:bg-[#737373] text-[#fafafa] transition-colors"
                    >
                      {copied ? <RiCheckLine /> : <RiCodeLine />}
                    </button>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-2">
                    <p className="text-sm text-[#a1a1a1]">Project Details:</p>
                    <div className="grid gap-2 text-sm">
                      <div className="p-3 rounded-lg bg-[#262626] border border-[#383838]">
                        <span className="text-[#a1a1a1]">Project ID:</span>
                        <p className="font-mono text-[#fafafa]">
                          {project?._id}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#262626] border border-[#383838]">
                        <span className="text-[#a1a1a1]">Theme:</span>
                        <p className="font-mono text-[#fafafa]">
                          {project?.theme}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#262626] border border-[#383838]">
                        <span className="text-[#a1a1a1]">Firebase UID:</span>
                        <p className="font-mono text-[#fafafa]">{user?.uid}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectPreview;
