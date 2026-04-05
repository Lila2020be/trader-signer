import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    features: ["5 vídeos/dia", "720p", "Marca d'água", "3 estilos", "5s máximo"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 49",
    period: "/mês",
    features: ["100 vídeos/dia", "4K Ultra HD", "Sem marca d'água", "Todos os estilos", "20s máximo", "Avatar Lipsync", "Prioridade na fila"],
    highlighted: true,
  },
  {
    name: "Business",
    price: "R$ 149",
    period: "/mês",
    features: ["Ilimitado", "4K Ultra HD", "API Access", "Todos os recursos", "Suporte dedicado", "Programa de afiliados"],
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Planos <span className="gradient-text">simples</span>
          </h2>
          <p className="text-muted-foreground text-lg">Comece grátis, evolua quando precisar.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-6 relative ${
                plan.highlighted ? "gradient-primary neon-glow" : "glass"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background rounded-full px-3 py-1 text-xs font-semibold">
                  <Sparkles className="w-3 h-3 text-neon-purple" /> Popular
                </div>
              )}
              <h3 className={`font-display text-xl font-bold mb-1 ${plan.highlighted ? "text-primary-foreground" : ""}`}>
                {plan.name}
              </h3>
              <div className={`font-display text-4xl font-bold mb-6 ${plan.highlighted ? "text-primary-foreground" : ""}`}>
                {plan.price}
                <span className={`text-sm font-normal ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.period}
                </span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlighted ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                    <Check className="w-4 h-4 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-xl font-medium text-sm transition-all hover:scale-105 ${
                  plan.highlighted
                    ? "bg-background text-foreground"
                    : "gradient-primary text-primary-foreground neon-glow"
                }`}
              >
                {plan.name === "Free" ? "Começar Grátis" : "Assinar Agora"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
