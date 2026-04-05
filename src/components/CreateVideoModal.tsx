import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Type, Image, Mic, ChevronDown } from "lucide-react";

interface CreateVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tabs = [
  { id: "text", label: "Texto → Vídeo", icon: Type },
  { id: "image", label: "Imagem → Vídeo", icon: Image },
  { id: "avatar", label: "Avatar Lipsync", icon: Mic },
] as const;

const styleOptions = [
  "Cinematográfico", "Ultra Realista", "Anime", "Futurista",
  "Vintage", "Dark Aesthetic", "Dramático", "Romântico",
];

const durationOptions = ["5s", "10s", "20s"];

const cameraOptions = ["Zoom In", "Pan Left", "Pan Right", "Tilt Up", "Cinematic", "Estático"];

const CreateVideoModal = ({ isOpen, onClose }: CreateVideoModalProps) => {
  const [activeTab, setActiveTab] = useState<string>("text");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Cinematográfico");
  const [duration, setDuration] = useState("5s");
  const [camera, setCamera] = useState("Cinematic");

  const suggestedPrompts = [
    "Uma cidade futurista com luzes neon refletindo na chuva à noite",
    "Uma floresta mágica com partículas brilhantes flutuando no ar",
    "Um astronauta caminhando em Marte durante o pôr do sol",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative glass rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto neon-glow"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-2xl font-bold gradient-text">Criar Vídeo</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-4 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "gradient-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {activeTab === "text" && (
                <>
                  {/* Prompt */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Descreva seu vídeo</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Uma cidade futurista com luzes neon..."
                      className="w-full h-28 bg-secondary rounded-xl p-4 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    />
                  </div>

                  {/* Suggestions */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Sugestões</label>
                    <div className="flex flex-wrap gap-2">
                      {suggestedPrompts.map((s) => (
                        <button
                          key={s}
                          onClick={() => setPrompt(s)}
                          className="text-xs bg-secondary hover:bg-muted px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-left"
                        >
                          {s.slice(0, 45)}...
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Style */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Estilo</label>
                      <div className="relative">
                        <select
                          value={style}
                          onChange={(e) => setStyle(e.target.value)}
                          className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {styleOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Duração</label>
                      <div className="flex gap-1">
                        {durationOptions.map((d) => (
                          <button
                            key={d}
                            onClick={() => setDuration(d)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                              duration === d
                                ? "gradient-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Camera */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Câmera</label>
                      <div className="relative">
                        <select
                          value={camera}
                          onChange={(e) => setCamera(e.target.value)}
                          className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {cameraOptions.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "image" && (
                <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Arraste imagens ou clique para fazer upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP · Até 10 imagens</p>
                </div>
              )}

              {activeTab === "avatar" && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center">
                    <Mic className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-1">Upload de foto de rosto</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG · Rosto frontal</p>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center">
                    <Mic className="w-10 h-10 text-neon-blue mx-auto mb-3" />
                    <p className="text-muted-foreground mb-1">Upload de áudio para lipsync</p>
                    <p className="text-xs text-muted-foreground">MP3, WAV · Até 60s</p>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button className="w-full gradient-primary rounded-xl py-4 font-display font-semibold text-lg text-primary-foreground neon-glow hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Gerar Vídeo
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateVideoModal;
