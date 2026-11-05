import { responseDetails } from "@/lib/feedback-presentation";

const fields = [
  { _id: "email", label: "Email", type: "email" },
  { _id: "message", label: "What could we improve?", type: "textarea" },
];
const examples = [
  { email: "ava@example.com", message: "Let me search older responses by a word or an email address." },
  { email: "jordan@example.com", message: "A saved summary would help our team decide what to fix next." },
  { email: "sam@example.com", message: "Please add search. Finding a response takes too long." },
];
export const demoResponses = examples.map((formAnswers, index) => responseDetails({
  _id: `demo-${index}`, timestamp: `2026-11-05T${12 - index}:00:00.000Z`, formAnswers,
}, fields));

export const demoSummary = {
  timestamp: "2026-11-05T12:05:00.000Z",
  responseCount: 3,
  tldr: "Two users want to find older responses faster. One user wants a saved summary to help plan the next release.",
  features: ["Search responses by text or email address.", "Save the feedback summary for the team."],
};
