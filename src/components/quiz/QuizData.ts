export interface QuizQuestion {
  id: number;
  question: string;
  subtitle: string;
  options: { label: string; emoji: string; value: string }[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Qual é o seu nível atual de francês?",
    subtitle: "Não se preocupe, temos um caminho para cada nível!",
    options: [
      { label: "Nunca estudei francês", emoji: "🌱", value: "iniciante" },
      { label: "Sei algumas palavras e frases", emoji: "📚", value: "basico" },
      { label: "Consigo manter uma conversa simples", emoji: "💬", value: "intermediario" },
      { label: "Já sou avançado, quero fluência", emoji: "🎯", value: "avancado" },
    ],
  },
  {
    id: 2,
    question: "Por que você quer aprender francês?",
    subtitle: "Isso nos ajuda a personalizar seu plano de estudos",
    options: [
      { label: "Viagem para a França", emoji: "✈️", value: "viagem" },
      { label: "Carreira e oportunidades profissionais", emoji: "💼", value: "carreira" },
      { label: "Morar em um país francófono", emoji: "🏠", value: "morar" },
      { label: "Cultura, filmes e literatura", emoji: "🎬", value: "cultura" },
    ],
  },
  {
    id: 3,
    question: "Quanto tempo por dia você pode dedicar?",
    subtitle: "Consistência é mais importante que quantidade!",
    options: [
      { label: "15 minutos por dia", emoji: "⏰", value: "15min" },
      { label: "30 minutos por dia", emoji: "🕐", value: "30min" },
      { label: "1 hora por dia", emoji: "🕑", value: "1hora" },
      { label: "Mais de 1 hora por dia", emoji: "🔥", value: "mais1hora" },
    ],
  },
  {
    id: 4,
    question: "Qual método de aprendizado funciona melhor para você?",
    subtitle: "Cada pessoa aprende de um jeito diferente",
    options: [
      { label: "Vídeo-aulas com explicação clara", emoji: "🎥", value: "video" },
      { label: "Prática com conversação", emoji: "🗣️", value: "conversacao" },
      { label: "Exercícios e repetição", emoji: "✍️", value: "exercicios" },
      { label: "Imersão total (músicas, filmes, textos)", emoji: "🎧", value: "imersao" },
    ],
  },
  {
    id: 5,
    question: "Em quanto tempo você quer alcançar seus objetivos?",
    subtitle: "Vamos criar um plano realista para você",
    options: [
      { label: "Em 3 meses", emoji: "🚀", value: "3meses" },
      { label: "Em 6 meses", emoji: "📈", value: "6meses" },
      { label: "Em 1 ano", emoji: "🎓", value: "1ano" },
      { label: "Sem pressa, no meu ritmo", emoji: "🌿", value: "sempressa" },
    ],
  },
];

export interface QuizResult {
  title: string;
  subtitle: string;
  description: string;
  recommendation: string;
}

export function getQuizResult(answers: Record<number, string>): QuizResult {
  const level = answers[1];
  
  if (level === "iniciante" || level === "basico") {
    return {
      title: "Seu Plano Personalizado Está Pronto! 🇫🇷",
      subtitle: "Você está no começo de uma jornada incrível",
      description: "Com base nas suas respostas, identificamos que o método ideal para você combina aulas estruturadas com prática imersiva. Em poucos meses, você já vai conseguir se comunicar em francês com confiança.",
      recommendation: "O curso Francês Descomplicado foi criado exatamente para o seu perfil. Com mais de 200 aulas organizadas do zero à fluência, você vai aprender no seu ritmo com um método comprovado.",
    };
  }
  
  return {
    title: "Seu Plano de Fluência Está Pronto! 🇫🇷",
    subtitle: "Você já tem uma base — agora é hora de acelerar",
    description: "Com base nas suas respostas, identificamos que você precisa de um método que desafie e expanda seu vocabulário e compreensão. A fluência está mais perto do que você imagina.",
    recommendation: "O curso Francês Descomplicado tem módulos avançados com conversação real, expressões idiomáticas e preparação para provas como DELF/DALF.",
  };
}
