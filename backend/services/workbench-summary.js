const { createHash } = require("node:crypto");
const mongoose = require("mongoose");
const issueKey = title => createHash("sha256").update(title.trim().toLowerCase().replace(/\s+/g, " ")).digest("hex");

// Reconcile against stable IDs, retaining human edits, status, position and deletion.
function reconcileIssues(existing, summary) {
  const issues = existing.map(issue => ({ ...issue, responseIds: [] }));
  for (const item of summary.evidence || []) {
    if (!item?.title?.trim() || !Array.isArray(item.responseIds)) continue;
    const key = issueKey(item.title);
    let issue = issues.find(issue => String(issue._id) === item.issueId)
      || issues.find(issue => issue.sourceKey === key || issueKey(issue.title) === key);
    if (!issue && !item.responseIds.length) continue;
    if (!issue) {
      issue = { _id: new mongoose.Types.ObjectId(), title: item.title.trim().slice(0, 2000), description: "", sourceKey: key, status: "todo", position: Date.now() + issues.length, createdAt: new Date(), deleted: false, responseIds: [] };
      issues.push(issue);
    }
    issue.responseIds = [...new Set([...issue.responseIds.map(String), ...item.responseIds.filter(id => mongoose.isValidObjectId(id))])];
    item.issueId = String(issue._id);
  }
  return issues;
}
module.exports = { reconcileIssues, issueKey };
