import { motion, AnimatePresence } from "framer-motion";

const DeleteZone = ({ isVisible, isDragging }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={`
            fixed bottom-0 left-0 right-0
            h-24 bg-red-500/20
            backdrop-blur-sm
            flex items-center justify-center
            border-t-2 border-red-500
            ${isDragging ? "bg-red-500/40" : ""}
          `}
        >
          <p className="text-red-500 font-medium">
            Drop here to remove feedback button
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteZone;