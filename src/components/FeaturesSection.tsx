import { motion } from "framer-motion";
import { Type, Image, Mic, Wand2, Zap, Film } from "lucide-react";

const features = [
  {
    icon: Type,
    title: "Text-to-Video",
    description: "Escreva um prompt e gere vídeos cinematográficos com controle de estilo, câmera e duração.",
  },
  {
    icon: Image,
    title: "Image-to-Video",
    description: "Anime suas imagens com parallax 3D, movimento realista e transições automáticas.",
  },
  {
    icon: Mic,
    title: "Avatar Lipsync",
    description: "Sincronização labial automática com expressões naturais e narração por voz IA.",
  },
  {
    icon: Wand2,
    title: "Upscale 4K",
    description: "Aumente a resolução automaticamente para qualidade cinematográfica ultra nítida.",
  },
  {
    icon: Zap,
    title: "Renderização Rápida",
    description: "Processamento em nuvem com GPU para resultados em segundos, não minutos.",
  },
  {
    icon: Film,
    title: "Efeitos Avançados",
    description: "Slow motion, loop infinito, legendas automáticas e trilha sonora personalizada.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Tudo que você precisa para <span className="gradient-text">criar</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Ferramentas profissionais de geração de vídeo com IA, acessíveis a todos.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 hover:neon-glow transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
