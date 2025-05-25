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
    <div className="min-h-screen bg-[#171717] text-[#e5e5e5] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full p-4 sm:p-6 rounded-lg bg-[#191919] border border-[#383838]"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-[#fafafa]">
          Welcome Back
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-[#a1a1a1] text-sm sm:text-base">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 sm:p-3 rounded-lg bg-[#262626] border border-[#383838] focus:border-[#737373] outline-none text-[#fafafa] text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-[#a1a1a1] text-sm sm:text-base">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 sm:p-3 rounded-lg bg-[#262626] border border-[#383838] focus:border-[#737373] outline-none text-[#fafafa] text-sm sm:text-base"
              required
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
            className="w-full transform rounded-lg bg-[#737373] px-6 py-3 sm:py-3 font-medium text-[#fafafa] text-sm sm:text-base transition-all duration-300 hover:bg-[#525252] active:bg-[#525252]"
          >
            Login
          </motion.button>
        </form>

        <div className="mt-4 sm:mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#383838]"></div>
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-2 bg-[#191919] text-[#a1a1a1]">
                Or continue with
              </span>
            </div>
          </div>

          <motion.button
            onClick={handleGoogleLogin}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
            }}
            className="mt-4 w-full flex items-center justify-center gap-3 rounded-lg border border-[#383838] bg-[#262626] px-4 py-3 text-[#fafafa] text-sm sm:text-base hover:bg-[#191919] active:bg-[#191919] transition-colors"
          >
            <FcGoogle size={20} />
            <span>Continue with Google</span>
          </motion.button>
        </div>

        <p className="mt-4 text-center text-[#a1a1a1] text-xs sm:text-sm">
          Don't have an account?{" "}
          <motion.a
            href="/signup"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-[#737373] hover:text-[#525252] underline"
          >
            Sign up
          </motion.a>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
