import { useState, useCallback, useEffect } from "react";
import { trackEvent, ensureVisitorLead, updateVisitorStep } from "@/lib/funnel-tracking";
import { motion } from "framer-motion";
import { quizQuestions, getQuizResult } from "@/components/quiz/QuizData";
import QuizProgress from "@/components/quiz/QuizProgress";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizResultComponent from "@/components/quiz/QuizResult";
import SalesPage from "@/components/sales/SalesPage";
import parisHero from "@/assets/paris-hero.jpg";

type Screen = "landing" | "quiz" | "result" | "sales";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("landing");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    trackEvent("page_view");
    ensureVisitorLead();
  }, []);

  const handleStartQuiz = useCallback(() => {
    trackEvent("quiz_start");
    updateVisitorStep("quiz_pergunta_1");
    setScreen("quiz");
  }, []);

  const handleAnswer = useCallback((value: string) => {
    const newAnswers = { ...answers, [quizQuestions[currentQuestion].id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < quizQuestions.length - 1) {
      const nextQ = currentQuestion + 2; // 1-indexed
      updateVisitorStep(`quiz_pergunta_${nextQ}`);
      setCurrentQuestion((prev) => prev + 1);
    } else {
      trackEvent("quiz_complete");
      updateVisitorStep("resultado");
      setScreen("result");
    }
  }, [answers, currentQuestion]);

  const handleGoToSales = useCallback(() => {
    updateVisitorStep("pagina_vendas");
    setScreen("sales");
  }, []);

  if (screen === "sales") return <SalesPage />;

  if (screen === "landing") {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img src={parisHero} alt="Paris" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/75" />
        </div>
        <div className="relative z-10 max-w-xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block text-4xl mb-4">🇫🇷</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4 leading-tight">
              Descubra o Caminho Ideal para Falar Francês
            </h1>
            <p className="text-lg text-primary-foreground/80 font-sans mb-10 max-w-md mx-auto">
              Responda 5 perguntas rápidas e receba um plano personalizado para alcançar a fluência.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStartQuiz}
              className="bg-accent text-accent-foreground font-sans font-bold text-lg px-10 py-4 rounded-lg animate-pulse-gold hover:brightness-110 transition-all"
            >
              Começar o Quiz Gratuito →
            </motion.button>
            <p className="text-xs text-primary-foreground/50 mt-4 font-sans">
              ⏱ Leva menos de 2 minutos
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (screen === "result") {
    const result = getQuizResult(answers);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
        <QuizResultComponent result={result} onCTA={handleGoToSales} />
      </div>
    );
  }

  // Quiz screen
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16">
      <QuizProgress current={currentQuestion + 1} total={quizQuestions.length} />
      <QuizQuestion
        question={quizQuestions[currentQuestion]}
        onAnswer={handleAnswer}
      />
    </div>
  );
};

export default Index;
