import { motion } from "framer-motion";

const DeleteZone = ({ isVisible, isDragging }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 20,
      }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
      className={`
        fixed bottom-10 left-1/2 -translate-x-1/2
        h-16 w-64
        pointer-events-${isVisible ? "auto" : "none"}
        backdrop-blur-sm
        flex items-center justify-center
        rounded-lg
        border-2 border-dashed border-red-500
        ${isDragging ? "bg-red-500/20" : "bg-red-500/10"}
        transition-colors duration-200
        z-40
      `}
      data-delete-zone
    >
      <p className="text-red-500 font-medium text-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        Drop to remove
      </p>
    </motion.div>
  );
};

export default DeleteZone;
