import React, { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Coffee01Icon } from "@hugeicons/core-free-icons";
import { motion as Motion } from "motion/react";

const BuyMeCoffeeButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);

  const handlePayment = async () => {
    if (running.current) return;
    running.current = true;
    setLoading(true);
    setError("");
    try {
      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      const response = await fetch(`${base}/api/payment/create-order`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: 50 }),
      });
      const order = await response.json();
      if (!response.ok) throw new Error(order.message || "Could not start checkout.");
      if (typeof window.Razorpay !== "function") throw new Error("Checkout did not load. Refresh and try again.");
      await new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID, amount: order.amount, currency: order.currency,
          name: "Buy Me a Coffee", description: "Support my work", order_id: order.orderId,
          modal: { ondismiss: resolve },
          handler: async (payment) => {
            try {
              for (let attempt = 0; attempt < 5; attempt++) {
                const verified = await fetch(`${base}/api/payment/verify`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...payment, checkoutToken: order.checkoutToken }),
                });
                const data = await verified.json();
                if (verified.ok) break;
                if (verified.status !== 409 || attempt === 4) throw new Error(data.message || "Could not verify payment.");
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
              resolve();
            } catch (error) { reject(error); }
          },
          theme: { color: "#3B82F6" },
        });
        checkout.on("payment.failed", () => reject(new Error("Payment failed. Please try again.")));
        checkout.open();
      });
    } catch (error) { setError(error.message); }
    finally { running.current = false; setLoading(false); }
  };

  return (
    <>
    <Motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      <Motion.button
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
        <Motion.div
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
        <Motion.div
          animate={loading ? { rotate: 360 } : {}}
          transition={{
            duration: 1,
            repeat: loading ? Infinity : 0,
            ease: "linear",
          }}
        >
          <HugeiconsIcon
            icon={Coffee01Icon}
            size={20}
            className="text-[#fefefe]"
            aria-hidden="true"
          />
        </Motion.div>

        {/* Button text */}
        <span className="relative z-10 text-gray-100">
          {loading ? "Brewing..." : "Buy Me a Coffee"}
        </span>
      </Motion.button>
    </Motion.div>
    {error && <p role="alert" className="mt-2 text-sm text-red-500">{error}</p>}
    </>
  );
};

export default BuyMeCoffeeButton;
