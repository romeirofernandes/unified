import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  deleteUser,
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  isGoogleUser,
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 "
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl bg-[#262626] p-6 z-50 space-y-4"
          >
            <h3 className="text-xl font-bold text-red-500">Delete Account</h3>
            <p className="text-[#e5e5e5]/80">
              {isGoogleUser
                ? "Please confirm account deletion by clicking the button below. You'll need to re-authenticate with Google."
                : "This action cannot be undone. Please enter your password to confirm."}
            </p>

            {!isGoogleUser && (
              <div className="space-y-2">
                <label className="text-sm text-[#e5e5e5]/60">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 rounded-lg bg-[#171717] border border-[#404040] focus:border-[#f59e0b] outline-none"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#e5e5e5]/60 hover:text-[#e5e5e5]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg hover:bg-[#404040] transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(password)}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Settings = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  const isGoogleUser = user?.providerData[0]?.providerId === "google.com";

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (password) => {
    setIsLoading(true);
    setError(null);

    try {
      const auth = getAuth();

      // Re-authenticate based on provider
      if (isGoogleUser) {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          password
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // Delete from backend
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/user`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "firebase-uid": user.uid,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete account from backend");
      }

      // Delete from Firebase
      await deleteUser(auth.currentUser);

      // Sign out and redirect
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Failed to delete account:", error);
      setError(
        error.code === "auth/wrong-password"
          ? "Incorrect password"
          : "Failed to delete account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-8 mt-4 sm:mt-6">
        <div>
          <h2 className="text-2xl font-bold mb-6">Settings</h2>
        </div>

        {/* Account Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">Account</h3>
          <div className="p-6 rounded-xl bg-[#262626] border border-[#404040] space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-[#e5e5e5]/60">Email</label>
              <p className="text-[#e5e5e5]">{user?.email}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#e5e5e5]/60">
                Account Created
              </label>
              <p className="text-[#e5e5e5]">
                {user?.metadata.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-red-500">Danger Zone</h3>
          <div className="p-6 rounded-xl bg-red-500/10 border border-red-500 space-y-4">
            <p className="text-sm text-red-500">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            {error && (
              <p className="text-sm text-red-500 bg-red-500/5 p-3 rounded-lg">
                {error}
              </p>
            )}
            <button
              onClick={handleDeleteClick}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={isLoading}
        isGoogleUser={isGoogleUser}
      />
    </DashboardLayout>
  );
};

export default Settings;
