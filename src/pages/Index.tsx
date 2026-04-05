import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import StylesSection from "@/components/StylesSection";
import PricingSection from "@/components/PricingSection";
import CreateVideoModal from "@/components/CreateVideoModal";

const Index = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection onCreateVideo={() => setShowCreateModal(true)} />
      <FeaturesSection />
      <StylesSection />
      <PricingSection />

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 text-center">
        <p className="text-muted-foreground text-sm">
          © 2026 MotionForge AI · Todos os direitos reservados
        </p>
      </footer>

      <CreateVideoModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
};

export default Index;
