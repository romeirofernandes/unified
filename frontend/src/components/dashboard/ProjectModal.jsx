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
                className="text-sm text-[#e5e5e5]"
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
                  className="flex-1 p-2 rounded-lg bg-[#404040] border border-[#404040]"
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
                  <RiDeleteBin6Line />
                </button>
              </div>
            ))}
          </div>
        );
      case "slider":
        return (
          <div className="mt-2 grid grid-cols-3 gap-2">
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
                className="w-full p-2 rounded-lg bg-[#404040] border border-[#404040]"
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
                className="w-full p-2 rounded-lg bg-[#404040] border border-[#404040]"
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
                className="w-full p-2 rounded-lg bg-[#404040] border border-[#404040]"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div className="w-full max-w-2xl bg-[#191919] rounded-lg p-6 shadow-xl border border-[#383838]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                {step === 2 && (
                  <button
                    onClick={() => setStep(1)}
                    className="mr-4 p-2 hover:bg-[#262626] rounded-lg transition-colors"
                  >
                    <RiArrowLeftLine size={20} className="text-[#a1a1a1]" />
                  </button>
                )}
                <h2 className="text-2xl font-bold text-[#fafafa]">
                  {step === 1 ? "Create New Project" : "Configure Fields"}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-[#a1a1a1]"
              >
                <RiCloseLine size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 text-[#a1a1a1]">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[#262626] border border-[#383838] focus:border-[#737373] outline-none text-[#fafafa]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-[#a1a1a1]">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[#262626] border border-[#383838] focus:border-[#737373] outline-none h-24 resize-none text-[#fafafa]"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-[#a1a1a1]">Theme</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[#262626] border border-[#383838] focus:border-[#737373] outline-none text-[#fafafa]"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-[#fafafa]">
                      Form Fields
                    </span>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="flex items-center space-x-2 text-[#737373] hover:text-[#525252]"
                    >
                      <RiAddLine />
                      <span>Add Field</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {fields.map((field, index) => (
                      <div
                        key={index}
                        className="bg-[#262626] p-4 rounded-lg space-y-2 border border-[#383838]"
                      >
                        <div className="flex items-center gap-4">
                          <select
                            value={field.type}
                            onChange={(e) =>
                              handleFieldChange(index, "type", e.target.value)
                            }
                            className="p-2 rounded-lg bg-[#191919] border border-[#383838] text-[#fafafa]"
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
                              handleFieldChange(index, "label", e.target.value)
                            }
                            placeholder="Field Label"
                            className="flex-1 p-2 rounded-lg bg-[#191919] border border-[#383838] text-[#fafafa]"
                          />
                          <label className="flex items-center space-x-2 text-[#a1a1a1]">
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
                              className="p-2 text-red-500 hover:bg-[#191919] rounded-lg"
                            >
                              <RiDeleteBin6Line />
                            </button>
                          )}
                        </div>
                        {renderFieldConfig(field, index)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-6 border-t border-[#383838]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg hover:bg-[#262626] transition-colors text-[#a1a1a1]"
                >
                  Cancel
                </button>
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 rounded-lg bg-[#737373] text-[#fafafa] hover:bg-[#525252] transition-colors"
                    disabled={!name}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#737373] text-[#fafafa] hover:bg-[#525252] transition-colors"
                  >
                    Create Project
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;
