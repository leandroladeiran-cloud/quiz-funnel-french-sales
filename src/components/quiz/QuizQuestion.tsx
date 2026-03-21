import { motion, AnimatePresence } from "framer-motion";
import type { QuizQuestion as QuizQuestionType } from "./QuizData";
import QuizOption from "./QuizOption";

interface QuizQuestionProps {
  question: QuizQuestionType;
  onAnswer: (value: string) => void;
}

const QuizQuestion = ({ question, onAnswer }: QuizQuestionProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md mx-auto"
      >
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground text-center mb-2">
          {question.question}
        </h2>
        <p className="text-muted-foreground text-center mb-8 font-sans">
          {question.subtitle}
        </p>
        <div className="flex flex-col gap-3">
          {question.options.map((option, index) => (
            <QuizOption
              key={option.value}
              label={option.label}
              emoji={option.emoji}
              onClick={() => onAnswer(option.value)}
              index={index}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuizQuestion;
