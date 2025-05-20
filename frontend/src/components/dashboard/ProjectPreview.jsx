import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCloseLine, RiCodeLine, RiCheckLine } from "react-icons/ri";
import { useAuth } from "../../context/AuthContext";

const ProjectPreview = ({ isOpen, onClose, project }) => {
  const { user } = useAuth();
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const codeSnippet = `import { UnifiedFeedback } from 'unified-sdk';

function App() {
  return (
    <UnifiedFeedback 
      projectId="${project?._id}"
      theme="${project?.theme}"
      firebaseUid="${user?.uid}"
    />
  );
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderField = (field, theme) => {
    const baseInputClass = `w-full p-3 rounded-lg ${
      theme === "dark"
        ? "bg-[#404040] border border-[#404040] placeholder-[#e5e5e5]/50"
        : "bg-white border border-gray-200 placeholder-[#171717]/60"
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
                  className="text-[#f59e0b]"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="w-full max-w-4xl bg-[#262626] rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[#404040]">
              <div>
                <h2 className="text-2xl font-bold">{project?.name}</h2>
                <p className="text-[#e5e5e5]/60 text-sm">
                  Preview & Integration
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#404040] rounded-lg transition-colors"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-2 gap-6 p-6">
              {/* Preview Section */}
              <div className="space-y-6">
                <h3 className="font-medium">Preview</h3>
                <div
                  className={`p-6 rounded-xl ${
                    project?.theme === "dark" ? "bg-[#171717]" : "bg-white"
                  }`}
                >
                  {project?.fields.map((field, index) => (
                    <div key={index} className="mb-4">
                      <label
                        className={`block mb-2 ${
                          project?.theme === "dark"
                            ? "text-[#e5e5e5]"
                            : "text-[#171717]"
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

              {/* Code Section */}
              <div className="space-y-6">
                <h3 className="font-medium">Integration</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-[#171717] relative group">
                    <pre className="text-sm font-mono text-[#e5e5e5]/70 overflow-x-auto">
                      <code>{codeSnippet}</code>
                    </pre>
                    <button
                      onClick={handleCopyCode}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-[#404040] hover:bg-[#f59e0b] hover:text-black transition-colors"
                    >
                      {copied ? <RiCheckLine /> : <RiCodeLine />}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-[#e5e5e5]/60">
                      Project Details:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-3 rounded-lg bg-[#171717]">
                        <span className="text-[#e5e5e5]/40">Project ID:</span>
                        <p className="font-mono">{project?._id}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[#171717]">
                        <span className="text-[#e5e5e5]/40">Theme:</span>
                        <p className="font-mono">{project?.theme}</p>
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
