import { motion } from "framer-motion";

const styles = [
  { name: "Cinematográfico", emoji: "🎬", gradient: "from-amber-500 to-orange-600" },
  { name: "Ultra Realista", emoji: "📸", gradient: "from-emerald-500 to-teal-600" },
  { name: "Anime", emoji: "⛩️", gradient: "from-pink-500 to-rose-600" },
  { name: "Futurista", emoji: "🚀", gradient: "from-cyan-500 to-blue-600" },
  { name: "Vintage", emoji: "📽️", gradient: "from-amber-700 to-yellow-600" },
  { name: "Dark Aesthetic", emoji: "🌑", gradient: "from-violet-600 to-purple-800" },
  { name: "Dramático", emoji: "🎭", gradient: "from-red-600 to-rose-800" },
  { name: "Romântico", emoji: "💫", gradient: "from-pink-400 to-fuchsia-500" },
];

const StylesSection = () => {
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
            Escolha seu <span className="gradient-text">estilo</span>
          </h2>
          <p className="text-muted-foreground text-lg">8 estilos visuais para dar vida às suas ideias.</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {styles.map((style, i) => (
            <motion.button
              key={style.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden rounded-2xl p-6 text-center group cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-20 group-hover:opacity-40 transition-opacity`} />
              <div className="absolute inset-0 glass" />
              <div className="relative z-10">
                <span className="text-3xl mb-3 block">{style.emoji}</span>
                <span className="font-display font-semibold text-sm">{style.name}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StylesSection;
