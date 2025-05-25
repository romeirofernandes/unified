import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCloseLine,
  RiAddLine,
  RiArrowLeftLine,
  RiDeleteBin6Line,
} from "react-icons/ri";

const ProjectModal = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("light");
  const [fields, setFields] = useState([
    { type: "email", label: "Email", required: true },
  ]);

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        type: "text",
        label: "",
        required: false,
        options: [],
        config: { min: 0, max: 100, step: 1 },
      },
    ]);
  };

  const handleFieldChange = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const handleAddOption = (index) => {
    const newFields = [...fields];
    if (!newFields[index].options) {
      newFields[index].options = [];
    }
    newFields[index].options.push({ label: "", value: "" });
    setFields(newFields);
  };

  const handleOptionChange = (fieldIndex, optionIndex, key, value) => {
    const newFields = [...fields];
    newFields[fieldIndex].options[optionIndex][key] = value;
    setFields(newFields);
  };

  const handleRemoveField = (index) => {
    if (index === 0) return; // Don't remove email field
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleNext = (e) => {
    e.preventDefault(); // Prevent form submission
    if (name.trim()) {
      setStep(2);
    }
  };

  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setTheme("light");
    setFields([{ type: "email", label: "Email", required: true }]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      return; // Don't submit if on first step
    }
    onSubmit({ name, description, theme, fields });
    handleClose(); // Use handleClose instead of onClose
  };

  const renderFieldConfig = (field, index) => {
    switch (field.type) {
      case "mcq":
        return (
          <div className="mt-2 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#e5e5e5]/70">Options</span>
              <button
                type="button"
                onClick={() => handleAddOption(index)}
                className="text-sm text-[#e5e5e5] px-2 py-1 rounded hover:bg-[#404040]"
              >
                Add Option
              </button>
            </div>
            {field.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Option ${optionIndex + 1}`}
                  value={option.label}
                  onChange={(e) => {
                    handleOptionChange(
                      index,
                      optionIndex,
                      "label",
                      e.target.value
                    );
                    handleOptionChange(
                      index,
                      optionIndex,
                      "value",
                      e.target.value
                    );
                  }}
                  className="flex-1 p-2 text-sm sm:text-base rounded-lg bg-[#404040] border border-[#404040] text-[#fafafa]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newFields = [...fields];
                    newFields[index].options.splice(optionIndex, 1);
                    setFields(newFields);
                  }}
                  className="p-2 text-red-500 hover:bg-[#404040] rounded-lg"
                >
                  <RiDeleteBin6Line size={16} />
                </button>
              </div>
            ))}
          </div>
        );
      case "slider":
        return (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-sm text-[#e5e5e5]/70">Min</label>
              <input
                type="number"
                value={field.config?.min}
                onChange={(e) =>
                  handleFieldChange(index, "config", {
                    ...field.config,
                    min: parseInt(e.target.value),
                  })
                }
                className="w-full p-2 text-sm sm:text-base rounded-lg bg-[#404040] border border-[#404040] text-[#fafafa]"
              />
            </div>
            <div>
              <label className="text-sm text-[#e5e5e5]/70">Max</label>
              <input
                type="number"
                value={field.config?.max}
                onChange={(e) =>
                  handleFieldChange(index, "config", {
                    ...field.config,
                    max: parseInt(e.target.value),
                  })
                }
                className="w-full p-2 text-sm sm:text-base rounded-lg bg-[#404040] border border-[#404040] text-[#fafafa]"
              />
            </div>
            <div>
              <label className="text-sm text-[#e5e5e5]/70">Step</label>
              <input
                type="number"
                value={field.config?.step}
                onChange={(e) =>
                  handleFieldChange(index, "config", {
                    ...field.config,
                    step: parseInt(e.target.value),
                  })
                }
                className="w-full p-2 text-sm sm:text-base rounded-lg bg-[#404040] border border-[#404040] text-[#fafafa]"
              />
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl max-h-[90vh] bg-[#191919] rounded-lg shadow-xl border border-[#383838] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[#383838]">
              <div className="flex items-center">
                {step === 2 && (
                  <button
                    onClick={() => setStep(1)}
                    className="mr-2 sm:mr-4 p-2 hover:bg-[#262626] rounded-lg transition-colors"
                  >
                    <RiArrowLeftLine size={20} className="text-[#a1a1a1]" />
                  </button>
                )}
                <h2 className="text-lg sm:text-2xl font-bold text-[#fafafa]">
                  {step === 1 ? "Create New Project" : "Configure Fields"}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-[#a1a1a1]"
              >
                <RiCloseLine size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {step === 1 ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block mb-2 text-[#a1a1a1] text-sm sm:text-base">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 text-sm sm:text-base rounded-lg bg-[#262626] border border-[#383838] focus:border-[#737373] outline-none text-[#fafafa]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-[#a1a1a1] text-sm sm:text-base">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 text-sm sm:text-base rounded-lg bg-[#262626] border border-[#383838] focus:border-[#737373] outline-none h-20 sm:h-24 resize-none text-[#fafafa]"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-[#a1a1a1] text-sm sm:text-base">
                        Theme
                      </label>
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="w-full p-3 text-sm sm:text-base rounded-lg bg-[#262626] border border-[#383838] focus:border-[#737373] outline-none text-[#fafafa]"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                      <span className="text-base sm:text-lg font-medium text-[#fafafa]">
                        Form Fields
                      </span>
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="flex items-center justify-center sm:justify-start space-x-2 text-[#737373] hover:text-[#525252] p-2 sm:p-0 rounded-lg hover:bg-[#262626] sm:hover:bg-transparent"
                      >
                        <RiAddLine />
                        <span className="text-sm sm:text-base">Add Field</span>
                      </button>
                    </div>

                    <div className="space-y-3 sm:space-y-4 max-h-[50vh] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
                      {fields.map((field, index) => (
                        <div
                          key={index}
                          className="bg-[#262626] p-3 sm:p-4 rounded-lg space-y-2 sm:space-y-3 border border-[#383838]"
                        >
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                            <select
                              value={field.type}
                              onChange={(e) =>
                                handleFieldChange(index, "type", e.target.value)
                              }
                              className="p-2 text-sm sm:text-base rounded-lg bg-[#191919] border border-[#383838] text-[#fafafa] w-full sm:w-auto"
                              disabled={index === 0}
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="textarea">Text Area</option>
                              <option value="mcq">Multiple Choice</option>
                              <option value="slider">Slider</option>
                            </select>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) =>
                                handleFieldChange(
                                  index,
                                  "label",
                                  e.target.value
                                )
                              }
                              placeholder="Field Label"
                              className="flex-1 p-2 text-sm sm:text-base rounded-lg bg-[#191919] border border-[#383838] text-[#fafafa]"
                            />
                            <div className="flex items-center justify-between sm:justify-start">
                              <label className="flex items-center space-x-2 text-[#a1a1a1] text-sm sm:text-base">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      index,
                                      "required",
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-[#383838] bg-[#191919] text-[#737373]"
                                />
                                <span>Required</span>
                              </label>
                              {index !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveField(index)}
                                  className="p-2 text-red-500 hover:bg-[#191919] rounded-lg ml-2 sm:ml-4"
                                >
                                  <RiDeleteBin6Line size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                          {renderFieldConfig(field, index)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 p-4 sm:p-6 border-t border-[#383838]">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-4 py-2 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-[#262626] transition-colors text-[#a1a1a1]"
              >
                Cancel
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full sm:w-auto px-4 py-2 sm:py-2 text-sm sm:text-base rounded-lg bg-[#737373] text-[#fafafa] hover:bg-[#525252] transition-colors"
                  disabled={!name}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full sm:w-auto px-4 py-2 sm:py-2 text-sm sm:text-base rounded-lg bg-[#737373] text-[#fafafa] hover:bg-[#525252] transition-colors"
                >
                  Create Project
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;
