const { createHash } = require("node:crypto");
const limits = { files: 8, fileBytes: 48 * 1024, contextBytes: 160 * 1024, changedFiles: 3, changedLines: 120, edits: 12, treeFiles: 3000 };
const fail = (message, status = 422) => Object.assign(new Error(message), { status });
function repositoryName(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_.-]{1,100}$/.test(value) || /\/\.{1,2}$/.test(value)) throw fail("Enter a repository as owner/repository.", 400);
  return value;
}
function safePath(path) {
  return typeof path === "string" && path.length <= 240 && !path.startsWith("/") && !path.split("/").some(part => !part || part === "." || part === ".." || part.startsWith(".")) && !/[\\\x00-\x1f]/.test(path)
    && !/(^|[\/_.-])(auth|login|signup|session|token|secret|credential|password|payment|billing|checkout|stripe|razorpay|middleware|server|backend|api|migration|database|schema|config|lock|vendor|dist|build|node_modules)([\/_.-]|$)/i.test(path)
    && /\.(jsx?|tsx?|css|md|mdx)$/.test(path);
}
function writablePath(path) {
  return safePath(path) && !/(^|[\/_.-])(test|tests|spec|specs|__tests__|__snapshots__)([\/_.-]|$)/i.test(path)
    && (/\.(md|mdx)$/.test(path) || /\.(jsx|tsx|css)$/.test(path))
    && !/(^|\/)(route|layout|page)\.(jsx?|tsx?)$/.test(path);
}
function sensitive(content) {
  return /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[a-zA-Z0-9]{20,}|github_pat_[a-zA-Z0-9_]{20,}|sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16}|AIza[a-zA-Z0-9_-]{30,})/.test(content);
}
function fingerprint(issue) {
  return createHash("sha256").update(JSON.stringify([issue.title, issue.description || ""])).digest("hex");
}
function validateAssessment(value, files) {
  if (!value || typeof value.suitable !== "boolean" || typeof value.reason !== "string" || !value.reason.trim() || value.reason.length > 2000 || !Array.isArray(value.plan) || value.plan.length > 5 || value.plan.some(item => typeof item !== "string" || item.length > 1000)) throw fail("The assessment was incomplete. Try a new assessment.");
  const categories = ["ui_copy", "ui_style", "ui_behavior", "documentation"];
  if (value.suitable && (!categories.includes(value.category) || !value.plan.length || !files.some(file => writablePath(file.path)))) throw fail("This issue falls outside the supported scope.");
  return { suitable: value.suitable, category: categories.includes(value.category) ? value.category : "unsupported", reason: value.reason.trim(), plan: value.plan };
}
function applyPatch(files, edits) {
  if (!Array.isArray(edits) || !edits.length || edits.length > limits.edits) throw fail("The proposed patch is empty or too large.");
  const originals = new Map(files.map(file => [file.path, file]));
  const updated = new Map();
  let lines = 0;
  for (const edit of edits) {
    if (!edit || !writablePath(edit.path) || !originals.has(edit.path) || typeof edit.before !== "string" || !edit.before || typeof edit.after !== "string" || edit.before === edit.after || sensitive(edit.after)) throw fail("The proposed patch touches unsupported content.");
    const content = updated.get(edit.path) ?? originals.get(edit.path).content;
    const index = content.indexOf(edit.before);
    if (index < 0 || content.indexOf(edit.before, index + 1) >= 0) throw fail("A patch must match exactly one location in the saved file.");
    const result = content.slice(0, index) + edit.after + content.slice(index + edit.before.length);
    if (!result.trim() || Buffer.byteLength(result) > limits.fileBytes) throw fail("The proposed patch removes a file or exceeds its size limit.");
    // Count both sides, conservatively, rather than trusting a model's estimate.
    lines += edit.before.split("\n").length + edit.after.split("\n").length;
    updated.set(edit.path, result);
  }
  if (updated.size > limits.changedFiles || lines > limits.changedLines) throw fail("This fix exceeds the 3-file / 120-line limit. Split the issue into smaller tasks.");
  if ([...updated].some(([path, content]) => content === originals.get(path).content)) throw fail("The patch cancels itself out.");
  return [...updated].map(([path, content]) => ({ path, content, sha: originals.get(path).sha }));
}
module.exports = { limits, fail, repositoryName, safePath, writablePath, sensitive, fingerprint, validateAssessment, applyPatch };
