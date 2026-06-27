import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flame, Mail, Lock, User, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

type AuthMode = "login" | "register" | "forgot";

export default function Auth() {
  const { user, loading, signIn, signUp, loginAsGuest } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Digite seu email primeiro");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        // Detect if redirect URL error occurred and give a helpful tip
        if (error.message.toLowerCase().includes("redirect url")) {
          toast.error("Erro de Redirecionamento: Verifique se este domínio está configurado na sua dashboard do Supabase.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
        setAuthMode("login");
      }
    } catch (err: any) {
      toast.error("Erro ao enviar email de recuperação.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (authMode === "login") {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        toast.error(error.message);
      }
    } else if (authMode === "register") {
      if (!name.trim()) {
        toast.error("Informe seu nome");
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email.trim(), password, name.trim());
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(
          "Conta criada com sucesso! Verifique seu email para confirmar."
        );
        setAuthMode("login");
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Flame className="w-8 h-8 text-primary" />
          <span className="font-bold text-2xl text-foreground">
            Trading<span className="text-primary">Signals</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          
          {authMode !== "forgot" ? (
            <>
              {/* Tabs for Login / Register */}
              <div className="flex mb-6 bg-secondary rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    authMode === "login"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    authMode === "register"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Cadastrar
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === "register" && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  {authMode === "login" ? "Entrar" : "Criar Conta"}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase">Ou</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <button
                  type="button"
                  onClick={loginAsGuest}
                  className="w-full bg-secondary border border-border text-foreground font-medium py-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
                >
                  Acesso Rápido (Convidado)
                </button>

                {authMode === "login" && (
                  <button
                    type="button"
                    onClick={() => setAuthMode("forgot")}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors pt-2"
                  >
                    Esqueceu sua senha?
                  </button>
                )}
              </form>
            </>
          ) : (
            <>
              {/* Forgot Password View */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o Login
                </button>
                <h2 className="text-lg font-semibold text-foreground mb-1">Recuperar Senha</h2>
                <p className="text-xs text-muted-foreground">
                  Enviaremos um link de recuperação para redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Seu email cadastrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enviar Link de Recuperação
                </button>
              </form>
            </>
          )}

          <div className="mt-4 text-center">
            {authMode !== "forgot" && (
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {authMode === "login"
                  ? "Não tem conta? Criar conta"
                  : "Já tem conta? Fazer login"}
              </button>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
