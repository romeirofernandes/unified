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
    return true;
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
module.exports = { createProject, submitFeedback, deleteProject, deleteAccount };
