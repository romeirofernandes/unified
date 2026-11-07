import { memo, useId, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, BubbleChatIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import Stepper, { Step } from "./Stepper";
import Field from "./Field";

const FeedbackModal = memo(function FeedbackModal({ isOpen, onClose, formData, theme, answers, onSubmit, onChange, pending = false, error }) {
  const [fieldError, setFieldError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const instanceId = useId();
  const form = useRef(null);
  if (!isOpen) return null;
  const total = formData.fields.length;
  const current = formData.fields[currentStep];
  function submit(event) {
    event.preventDefault();
    if (pending) return;
    if (current.type === "date" && current.required && !answers[current._id]) {
      setFieldError("Choose a date to continue.");
      form.current.getRootNode().getElementById(`${instanceId}-field-${current._id}`)?.focus();
      return;
    }
    setFieldError("");
    if (currentStep === total - 1) onSubmit(event);
    else setCurrentStep(value => value + 1);
  }
  return <div className="uf-form-content">
    <div className="uf-heading-row">
      <div className="uf-eyebrow"><HugeiconsIcon icon={BubbleChatIcon} size={17} aria-hidden="true" /><span>Feedback</span></div>
      <button type="button" className="uf-icon-button" onClick={onClose} disabled={pending} aria-label="Close feedback"><HugeiconsIcon icon={Cancel01Icon} size={18} aria-hidden="true" /></button>
    </div>
    <header className="uf-heading"><h2>{formData.name}</h2><p>Share an idea or report a problem.</p></header>
    <form ref={form} onSubmit={submit}>
      <div className="uf-question-meta"><span>Question {currentStep + 1} of {total}</span><span>{current.required ? "Required" : "Optional"}</span></div>
      <Stepper step={currentStep + 1} indicator="bars" disableStepIndicators showFooter={false} frame={false} theme={theme} width="100%" radius={10}
        style={{ "--stepper-ink": "var(--uf-text)", "--stepper-muted": "var(--uf-muted)", "--stepper-solid": "var(--uf-accent)", "--stepper-solid-ink": "var(--uf-accentText)", "--stepper-track": "var(--uf-border)" }}>
        {formData.fields.map(field => <Step key={field._id}>
          <div className="uf-question">
            <label id={`${instanceId}-label-${field._id}`} htmlFor={`${instanceId}-field-${field._id}`} className="uf-question-label">{field.label}</label>
            <fieldset disabled={pending} className="uf-fieldset">
              <Field field={field} value={answers[field._id]} idPrefix={instanceId} onChange={(id, value) => { setFieldError(""); onChange(id, value); }} />
            </fieldset>
          </div>
        </Step>)}
      </Stepper>
      {(error || fieldError) && <p role="alert" className="uf-error">{fieldError || error}</p>}
      <footer className="uf-form-footer">
        <button type="button" className="uf-button uf-button-back" disabled={pending} style={{ visibility: currentStep === 0 ? "hidden" : undefined }} onClick={() => { setFieldError(""); setCurrentStep(value => Math.max(0, value - 1)); }}><HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />Back</button>
        <button type="submit" disabled={pending} className="uf-button uf-button-primary">
          {pending ? <><span className="uf-spinner" aria-hidden="true" />Sending…</> : <>{currentStep === total - 1 ? "Send feedback" : "Continue"}<HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" /></>}
        </button>
      </footer>
    </form>
  </div>;
});
export default FeedbackModal;
