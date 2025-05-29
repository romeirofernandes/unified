import React, { useState } from "react";
import { Coffee } from "lucide-react";
import { motion } from "framer-motion";

const BuyMeCoffeeButton = () => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 50 }),
      });

      const { orderId, amount } = await response.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: amount,
        currency: "INR",
        name: "Buy Me a Coffee",
        description: "Support my work ☕",
        order_id: orderId,
        handler: function (response) {
          verifyPayment(response);
        },
        theme: { color: "#3B82F6" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentData) => {
    await fetch("http://localhost:8000/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      <motion.button
        onClick={handlePayment}
        disabled={loading}
        className="relative overflow-hidden px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-3 transition-all duration-300 border-2 border-gray-700/50"
        style={{
          background:
            "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
        }}
        whileHover={{
          background:
            "linear-gradient(225deg, #2d2d2d 0%, #404040 50%, #2d2d2d 100%)",
          borderColor: "#525252",
        }}
        animate={{
          background: loading
            ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)"
            : "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
        }}
      >
        {/* Top border highlight */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Bottom shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-black/40 to-transparent" />

        {/* Animated background shimmer */}
        <motion.div
          className="absolute inset-0 opacity-0"
          animate={{
            background: [
              "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
              "linear-gradient(225deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
              "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
            ],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
          }}
        />

        {/* Coffee icon */}
        <motion.div
          animate={loading ? { rotate: 360 } : {}}
          transition={{
            duration: 1,
            repeat: loading ? Infinity : 0,
            ease: "linear",
          }}
        >
          <Coffee size={20} className="text-[#fefefe]" />
        </motion.div>

        {/* Button text */}
        <span className="relative z-10 text-gray-100">
          {loading ? "Brewing..." : "Buy Me a Coffee"}
        </span>
      </motion.button>
    </motion.div>
  );
};

export default BuyMeCoffeeButton;
