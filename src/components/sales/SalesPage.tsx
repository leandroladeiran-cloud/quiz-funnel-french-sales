import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Star, Shield, Clock, Users, BookOpen, ArrowRight, Play } from "lucide-react";
import parisHero from "@/assets/paris-hero.jpg";
import PreCheckoutDialog from "./PreCheckoutDialog";
import { trackEvent } from "@/lib/funnel-tracking";

const testimonials = [
  {
    name: "Mariana Silva",
    text: "Em 4 meses eu já conseguia me virar sozinha em Paris. O método é incrível!",
    stars: 5,
  },
  {
    name: "Carlos Eduardo",
    text: "Tentei vários cursos antes, mas esse foi o único que me fez realmente falar francês.",
    stars: 5,
  },
  {
    name: "Ana Beatriz",
    text: "As aulas são dinâmicas e o suporte é excelente. Recomendo demais!",
    stars: 5,
  },
];

const benefits = [
  "Mais de 200 aulas em vídeo HD",
  "Do zero à fluência com método comprovado",
  "Exercícios práticos após cada módulo",
  "Acesso vitalício ao conteúdo",
  "Comunidade exclusiva de alunos",
  "Certificado de conclusão",
  "Aulas de pronúncia com nativos",
  "Material de apoio em PDF",
];

const SalesPage = () => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    trackEvent("sales_view");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={parisHero} alt="Paris" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block bg-accent/20 text-gold-light font-sans text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              🇫🇷 Método validado por +5.000 alunos
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground mb-6 leading-tight">
              Fale Francês com Confiança em Poucos Meses
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 font-sans max-w-2xl mx-auto mb-10">
              O curso completo que leva você do zero à fluência com um método prático, 
              divertido e comprovado. Sem enrolação.
            </p>
            <motion.a
              href="#oferta"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-sans font-bold text-lg px-10 py-4 rounded-lg animate-pulse-gold hover:brightness-110 transition-all"
            >
              Quero Falar Francês
              <ArrowRight className="w-5 h-5" />
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="bg-card border-b border-border py-6">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-8 text-center">
          {[
            { icon: Users, label: "+5.000 alunos" },
            { icon: Star, label: "4.9/5 avaliação" },
            { icon: BookOpen, label: "200+ aulas" },
            { icon: Clock, label: "Acesso vitalício" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-muted-foreground font-sans">
              <Icon className="w-5 h-5 text-accent" />
              <span className="font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground text-center mb-4">
            Tudo o que Você Precisa para Falar Francês
          </h2>
          <p className="text-muted-foreground text-center font-sans mb-12 max-w-xl mx-auto">
            Um curso completo, do básico ao avançado, com tudo incluído.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border"
              >
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="font-sans text-foreground">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video section */}
      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
            Veja Como Funciona
          </h2>
          <p className="text-primary-foreground/70 font-sans mb-8">
            Uma prévia do que você vai encontrar dentro do curso
          </p>
          <div className="aspect-video bg-primary-foreground/10 rounded-xl flex items-center justify-center border border-primary-foreground/20 cursor-pointer group hover:bg-primary-foreground/15 transition-colors">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-accent-foreground ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground text-center mb-12">
            O Que Nossos Alunos Dizem
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-foreground font-sans mb-4 leading-relaxed">"{t.text}"</p>
                <p className="text-sm font-sans font-semibold text-muted-foreground">— {t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section id="oferta" className="py-20 px-6 bg-card">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block bg-rose/10 text-rose font-sans text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              🔥 Oferta por tempo limitado
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Comece Sua Jornada Hoje
            </h2>
            <p className="text-muted-foreground font-sans mb-8">
              Acesso completo a todo o conteúdo com garantia de 7 dias
            </p>

            <div className="bg-background border-2 border-accent rounded-2xl p-8 mb-6">
              <p className="text-sm text-muted-foreground font-sans line-through mb-1">
                De R$ 497,00
              </p>
              <p className="text-5xl font-display font-bold text-foreground mb-1">
                R$ 197<span className="text-2xl">,00</span>
              </p>
              <p className="text-sm text-muted-foreground font-sans mb-6">
                ou 12x de R$ 19,07
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCheckoutOpen(true)}
                className="w-full py-4 px-8 bg-accent text-accent-foreground font-sans font-bold text-lg rounded-lg animate-pulse-gold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
              >
                Garantir Minha Vaga
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground font-sans">
                <Shield className="w-4 h-4" />
                <span>Garantia incondicional de 7 dias</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground font-sans">
              <p>✅ Acesso imediato após a compra</p>
              <p>✅ Pagamento 100% seguro</p>
              <p>✅ Suporte dedicado ao aluno</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-primary text-primary-foreground/60 text-center font-sans text-sm">
        <p>© 2026 Francês Descomplicado. Todos os direitos reservados.</p>
      </footer>

      <PreCheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
};

export default SalesPage;
