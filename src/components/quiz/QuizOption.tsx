import { motion } from "framer-motion";

interface QuizOptionProps {
  label: string;
  emoji: string;
  onClick: () => void;
  index: number;
}

const QuizOption = ({ label, emoji, onClick, index }: QuizOptionProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 p-5 rounded-lg border-2 border-border bg-card hover:border-accent hover:shadow-lg transition-all duration-300 text-left group"
    >
      <span className="text-3xl group-hover:scale-110 transition-transform">{emoji}</span>
      <span className="text-base font-sans font-medium text-card-foreground">{label}</span>
    </motion.button>
  );
};

export default QuizOption;
