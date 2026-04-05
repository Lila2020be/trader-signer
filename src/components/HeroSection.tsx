import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

interface HeroSectionProps {
  onCreateVideo: () => void;
}

const HeroSection = ({ onCreateVideo }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-neon-purple" />
            <span className="text-sm text-muted-foreground">Powered by AI · Geração cinematográfica</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
        >
          <span className="gradient-text">Motion</span>
          <span className="text-foreground">Forge</span>
          <span className="text-muted-foreground font-light ml-3">AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Transforme texto e imagens em vídeos cinematográficos com IA avançada.
          Qualidade profissional em segundos.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onCreateVideo}
            className="group relative gradient-primary rounded-xl px-8 py-4 font-display font-semibold text-lg text-primary-foreground neon-glow transition-all hover:scale-105 flex items-center gap-3"
          >
            <Play className="w-5 h-5" />
            Criar Vídeo
            <div className="absolute inset-0 rounded-xl gradient-primary opacity-0 group-hover:opacity-50 blur-xl transition-opacity" />
          </button>
          <button className="glass rounded-xl px-8 py-4 font-display font-medium text-foreground hover:bg-secondary transition-colors">
            Ver Galeria
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto"
        >
          {[
            { value: "4K", label: "Resolução" },
            { value: "<30s", label: "Renderização" },
            { value: "8+", label: "Estilos" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
