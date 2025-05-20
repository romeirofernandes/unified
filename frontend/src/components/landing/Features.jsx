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
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      viewport={{ once: true }}
      className="mx-5 relative mt-32"
      id="features"
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 text-[#fafafa]">
        Powerful <span className="text-[#737373]">Features</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1,
              ease: "easeInOut",
            }}
            viewport={{ once: true }}
            className="p-6 rounded-lg bg-[#191919] border border-[#383838]"
          >
            <h3 className="text-xl font-bold mb-3 text-[#fafafa]">
              {feature.title}
            </h3>
            <p className="text-[#a1a1a1]">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default Features;
