import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import type { QuizResult as QuizResultType } from "./QuizData";

interface QuizResultProps {
  result: QuizResultType;
  onCTA: () => void;
}

const QuizResultComponent = ({ result, onCTA }: QuizResultProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-lg mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center"
      >
        <CheckCircle className="w-10 h-10 text-accent" />
      </motion.div>

      <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
        {result.title}
      </h2>
      <p className="text-lg text-accent font-sans font-semibold mb-6">
        {result.subtitle}
      </p>
      <p className="text-muted-foreground font-sans leading-relaxed mb-4">
        {result.description}
      </p>
      <div className="bg-card border border-border rounded-lg p-6 mb-8 text-left">
        <p className="text-sm font-sans text-muted-foreground uppercase tracking-wider mb-2">
          Nossa recomendação para você:
        </p>
        <p className="text-foreground font-sans leading-relaxed">
          {result.recommendation}
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onCTA}
        className="w-full py-4 px-8 bg-accent text-accent-foreground font-sans font-bold text-lg rounded-lg animate-pulse-gold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
      >
        Quero Começar Agora
        <ArrowRight className="w-5 h-5" />
      </motion.button>
      <p className="text-xs text-muted-foreground mt-3 font-sans">
        🔒 Acesso imediato · Garantia de 7 dias
      </p>
    </motion.div>
  );
};

export default QuizResultComponent;
