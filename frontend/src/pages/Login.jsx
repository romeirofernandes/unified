import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      setError("Failed to login. Please check your credentials.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      setError("Failed to login with Google.");
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] text-[#e5e5e5] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full p-6 rounded-2xl bg-[#262626] border border-[#404040]"
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Welcome Back</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#404040] border border-[#404040] focus:border-[#f59e0b] outline-none"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#404040] border border-[#404040] focus:border-[#f59e0b] outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#f59e0b] px-4 py-3 text-black hover:bg-[#92400e] hover:text-[#fde68a]"
          >
            Login
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#404040]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#262626] text-[#e5e5e5]/50">
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="mt-4 w-full flex items-center justify-center gap-3 rounded-lg border border-[#404040] px-4 py-3 hover:bg-[#404040]"
          >
            <FcGoogle size={20} />
            <span>Google</span>
          </button>
        </div>

        <p className="mt-4 text-center text-[#e5e5e5]/50">
          Don't have an account?{" "}
          <a href="/signup" className="text-[#f59e0b] hover:underline">
            Sign up
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
