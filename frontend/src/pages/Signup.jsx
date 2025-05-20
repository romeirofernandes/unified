import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FcGoogle } from "react-icons/fc";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(email, password);
      navigate("/dashboard");
    } catch (error) {
      setError("Failed to create an account.");
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      setError("Failed to sign up with Google.");
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] text-[#e5e5e5] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full p-6 rounded-lg bg-[#191919] border border-[#383838]"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-[#fafafa]">
          Create Account
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-[#a1a1a1]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#262626] border border-[#383838] focus:border-[#737373] outline-none text-[#fafafa]"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-[#a1a1a1]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#262626] border border-[#383838] focus:border-[#737373] outline-none text-[#fafafa]"
              required
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
            className="w-full transform rounded-lg bg-[#737373] px-6 py-3 font-medium text-[#fafafa] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#525252]"
          >
            Sign Up
          </motion.button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#383838]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#191919] text-[#a1a1a1]">
                Or continue with
              </span>
            </div>
          </div>

          <motion.button
            onClick={handleGoogleSignup}
            whileHover={{ scale: 1.05 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
            className="mt-4 w-full flex items-center justify-center gap-3 rounded-lg border border-[#383838] bg-[#262626] px-4 py-3 text-[#fafafa] hover:bg-[#191919]"
          >
            <FcGoogle size={20} />
            <span>Google</span>
          </motion.button>
        </div>

        <p className="mt-4 text-center text-[#a1a1a1]">
          Already have an account?{" "}
          <motion.a
            href="/login"
            whileHover={{ scale: 1.05 }}
            className="text-[#737373] hover:text-[#525252]"
          >
            Login
          </motion.a>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
