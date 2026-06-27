import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flame, Lock, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let errorTimer: ReturnType<typeof setTimeout>;

    // Detect if we have an access token in the URL hash or query params
    const urlString = window.location.href;
    const hasAccessToken = urlString.includes("access_token") || window.location.hash.includes("access_token");

    if (hasAccessToken) {
      // Fallback to show the form if the event is delayed
      timer = setTimeout(() => {
        setReady(true);
      }, 1200);
    } else {
      // If there's no access token, check if there is an active session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setReady(true);
        } else {
          setErrorMsg("Link de recuperação inválido ou expirado. Por favor, solicite um novo e-mail.");
        }
      });
    }

    // Listen to authentication state changes (PASSWORD_RECOVERY or SIGNED_IN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setErrorMsg(null);
        if (timer) clearTimeout(timer);
        if (errorTimer) clearTimeout(errorTimer);
      }
    });

    // Show error if we had a token but no session was set after 6 seconds
    if (hasAccessToken) {
      errorTimer = setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setErrorMsg("Não foi possível validar o link de recuperação. O link pode ter expirado ou é inválido. Solicite um novo link.");
          }
        });
      }, 6000);
    }

    return () => {
      subscription.unsubscribe();
      if (timer) clearTimeout(timer);
      if (errorTimer) clearTimeout(errorTimer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada com sucesso!");
      // Force sign out to require signing in with new password
      await supabase.auth.signOut();
      localStorage.removeItem("mock_user");
      navigate("/auth");
    }
    setSubmitting(false);
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <Flame className="w-8 h-8 text-primary" />
            <span className="font-bold text-2xl text-foreground">
              Trading<span className="text-primary">Signals</span>
            </span>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4 border border-destructive/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Erro de Recuperação</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {errorMsg}
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Voltar ao Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground animate-pulse">Validando token de acesso...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Flame className="w-8 h-8 text-primary" />
          <span className="font-bold text-2xl text-foreground">
            Trading<span className="text-primary">Signals</span>
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-foreground mb-2">Nova Senha</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Digite sua nova senha abaixo para redefinir o acesso à sua conta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Atualizar Senha
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
