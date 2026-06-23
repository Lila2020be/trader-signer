import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useUserRole() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(true); // <--- FORÇADO PARA TESTE
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Forçando admin true localmente
    setIsAdmin(true);
    setLoading(false);
  }, [user]);

  return { isAdmin, loading };
}
