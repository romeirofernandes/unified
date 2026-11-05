import test from "node:test";
import assert from "node:assert/strict";
import { feedbackPrompt } from "../src/lib/feedback-prompt.js";

test("the copy prompt uses the saved analysis with short instructions and no style directives", () => {
  const prompt = feedbackPrompt({ tldr: "Users cannot find old responses.", features: ["Repair the response search."] });
  assert.ok(prompt.includes("Users cannot find old responses."));
  assert.ok(prompt.includes("Repair the response search."));
  assert.doesNotMatch(prompt, /ASD|STE100|WRITING RULES|formAnswers/);
  for (const instruction of prompt.split("PROCEDURE\n")[1].split("\n")) {
    assert.ok(instruction.replace(/^\d+\. /, "").split(/\s+/).length <= 20);
  }
});
