import { motion } from "framer-motion";
import { Flame, Menu } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 glass border-b border-border"
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-neon-purple" />
          <span className="font-display font-bold text-lg">
            <span className="gradient-text">Motion</span>Forge
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Recursos</a>
          <a href="#" className="hover:text-foreground transition-colors">Estilos</a>
          <a href="#" className="hover:text-foreground transition-colors">Preços</a>
          <a href="#" className="hover:text-foreground transition-colors">Galeria</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Entrar
          </button>
          <button className="gradient-primary rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground hover:scale-105 transition-transform">
            Começar Grátis
          </button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden glass border-t border-border px-4 py-4 space-y-3"
        >
          <a href="#" className="block text-sm text-muted-foreground">Recursos</a>
          <a href="#" className="block text-sm text-muted-foreground">Estilos</a>
          <a href="#" className="block text-sm text-muted-foreground">Preços</a>
          <button className="w-full gradient-primary rounded-lg py-2 text-sm font-medium text-primary-foreground mt-2">
            Começar Grátis
          </button>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
