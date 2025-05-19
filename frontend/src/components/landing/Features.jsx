import React from "react";
import { motion } from "framer-motion";

const features = [
  {
    title: "One-Click Installation",
    description:
      "Add our feedback component to your website with a single line of code. No complex setup required.",
  },
  {
    title: "Customizable Forms",
    description:
      "Create custom feedback forms with different field types. Collect exactly what you need.",
  },
  {
    title: "AI-Powered Insights",
    description:
      "Get AI-generated summaries of your feedback to identify patterns and key themes.",
  },
];

const Features = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      viewport={{ once: true }}
      className="mt-32"
      id="features"
    >
      <h2 className="text-3xl font-bold text-center mb-12">
        Powerful <span className="text-[#f59e0b]">Features</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 rounded-xl bg-[#262626] border border-[#404040]"
          >
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-[#e5e5e5]/70">{feature.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Features;
