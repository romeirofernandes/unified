import React from "react";
import { motion } from "framer-motion";

const testimonials = [
  {
    content:
      "Unified has completely transformed how we collect and analyze user feedback. The AI summaries are a game-changer!",
    name: "Sarah Chen",
    role: "Lead Developer at TechCorp",
    initial: "S",
  },
  {
    content:
      "Implementation was super easy. Just one line of code and we were up and running with a professional feedback system.",
    name: "Michael Ross",
    role: "Frontend Engineer at StartupX",
    initial: "M",
  },
  {
    content:
      "The customizable forms and real-time analytics have helped us make better product decisions faster than ever.",
    name: "Alex Kumar",
    role: "Product Manager at DevFlow",
    initial: "A",
  },
];

const Testimonials = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="relative mt-32 px-4"
      id="testimonials"
    >

      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 text-[#fafafa]">
        Loved by <span className="text-[#737373]">Developers</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
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
            <p className="text-[#a1a1a1] mb-4">"{testimonial.content}"</p>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center text-[#737373] border border-[#383838]">
                {testimonial.initial}
              </div>
              <div className="ml-3">
                <p className="font-medium text-[#fafafa]">{testimonial.name}</p>
                <p className="text-sm text-[#a1a1a1]">{testimonial.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default Testimonials;
