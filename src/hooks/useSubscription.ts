import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    if (user.id === "guest-id-123") {
      setSubscription({
        id: "mock-sub",
        user_id: user.id,
        status: "active",
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setSubscription(data as Subscription | null);
      setLoading(false);
    };

    fetch();
  }, [user?.id]);

  const isActive = subscription?.status === "active" && 
    (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

  return { subscription, isActive, loading };
}
