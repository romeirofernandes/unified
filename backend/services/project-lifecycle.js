const mongoose = require("mongoose");
const Project = require("../models/Project");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const { validateAnswers } = require("./submission-answers");
const unavailable = () => Object.assign(new Error("Project not found or account deletion in progress."), { status: 404 });

async function lockOwner(userId, session) {
  const owner = await User.findOneAndUpdate({ _id: userId, deleting: { $ne: true } }, { $inc: { writeVersion: 1 } }, { session });
  if (!owner) throw unavailable();
}
async function createProject(data) {
  return mongoose.connection.transaction(async (session) => {
    await lockOwner(data.userId, session);
    const [project] = await Project.create([data], { session });
    return project;
  });
}
async function submitFeedback(filter, answers, subscriptionEmail) {
  subscriptionEmail = require("./feedback-subscriptions").validateSubscription(subscriptionEmail);
  return mongoose.connection.transaction(async (session) => {
    // Both submission and deletion write this document, forcing one to retry.
    const project = await Project.findOneAndUpdate(filter, { $inc: { writeVersion: 1 } }, { new: true, session });
    if (!project) throw unavailable();
    await lockOwner(project.userId, session);
    const formAnswers = validateAnswers(project.fields, answers);
    const [feedback] = await Feedback.create([{ projectId: project._id, formAnswers, subscriptionEmail: project.shippingUpdatesEnabled ? subscriptionEmail : undefined }], { session });
    return feedback;
  });
}
async function deleteProject(filter) {
  return mongoose.connection.transaction(async (session) => {
    const project = await Project.findOneAndDelete(filter, { session });
    if (!project) return false;
    await Feedback.deleteMany({ projectId: project._id }, { session });
    await require("../models/PullRequestRun").deleteMany({ projectId: project._id }, { session });
    await require("../models/PullRequestConnection").deleteMany({ projectId: project._id }, { session });
    await require("../models/RepositoryBlob").deleteMany({ projectId: project._id }, { session });
    return true;
  });
}
async function resetFeedback(filter) {
  return mongoose.connection.transaction(async session => {
    const now = new Date();
    const project = await Project.findOneAndUpdate(filter, {
      $inc: { writeVersion: 1, feedbackGeneration: 1 },
      $set: { feedbackSummary: null },
      $unset: { summaryLock: 1, summaryLockUntil: 1 },
    }, { new: true, session });
    if (!project) throw unavailable();
    await lockOwner(project.userId, session);
    const { deletedCount } = await Feedback.deleteMany({ projectId: project._id }, { session });
    await Project.updateOne({ _id: project._id, "workbenchIssues.0": { $exists: true } }, { $set: { "workbenchIssues.$[].responseIds": [] } }, { session });
    const set = {}, unset = {};
    for (const channel of ["slack", "email"]) {
      const prefix = `notifications.${channel}`;
      set[`${prefix}.since`] = now;
      set[`${prefix}.nextRunAt`] = new Date(now.getTime() + (project.notifications?.[channel]?.cadence === "hourly" ? 3600000 : 86400000));
      set[`${prefix}.lastCount`] = 0;
      set[`${prefix}.error`] = "";
      for (const key of ["lockToken", "lockUntil", "pendingUntil", "pendingSummary", "lastSummaryHash"]) unset[`${prefix}.${key}`] = 1;
    }
    await Project.updateOne({ _id: project._id }, { $set: set, $unset: unset }, { session });
    return { deletedCount, feedbackGeneration: project.feedbackGeneration };
  });
}
async function deleteAccount(uid, idToken, removeIdentity = require("./firebase-identity").deleteIdentity) {
  const user = await User.findOneAndUpdate({ firebaseUid: uid }, { $set: { deleting: true } }, { new: true });
  if (user) {
    const projects = await Project.find({ userId: user._id }).select("_id").lean();
    for (const project of projects) await deleteProject({ _id: project._id, userId: user._id });
  }
  // Keep the tombstone until both systems finish, so a failed request is resumable.
  await removeIdentity(idToken);
  if (user) await User.deleteOne({ _id: user._id, deleting: true });
}
module.exports = { createProject, submitFeedback, resetFeedback, deleteProject, deleteAccount };
