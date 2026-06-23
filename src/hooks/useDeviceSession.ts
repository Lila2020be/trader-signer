import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { generateDeviceFingerprint, getDeviceInfo } from "@/lib/deviceFingerprint";

export function useDeviceSession() {
  const { user, signOut } = useAuth();
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDeviceBlocked(false);
      setLoading(false);
      return;
    }

    const fingerprint = generateDeviceFingerprint();
    const deviceInfo = getDeviceInfo();

    const validateDevice = async () => {
      if (user.id === "guest-id-123") {
        setDeviceBlocked(false);
        setLoading(false);
        return;
      }
      try {
        // Check active sessions for this user
        const { data: sessions } = await supabase
          .from("device_sessions")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true);

        const existingSession = sessions?.find(s => s.device_fingerprint === fingerprint);

        if (existingSession) {
          // Update last seen
          await supabase
            .from("device_sessions")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("id", existingSession.id);
          setDeviceBlocked(false);
        } else if (sessions && sessions.length >= 1) {
          // Device limit reached - block this device
          // Log the attempt
          await supabase.from("access_logs").insert({
            user_id: user.id,
            action: "device_blocked",
            device_fingerprint: fingerprint,
            details: `Tentativa de acesso bloqueada. Dispositivo: ${deviceInfo}. Limite de 1 dispositivo atingido.`,
          });
          setDeviceBlocked(true);
          setLoading(false);
          return;
        } else {
          // No active sessions - register this device
          await supabase.from("device_sessions").insert({
            user_id: user.id,
            device_fingerprint: fingerprint,
            device_info: deviceInfo,
          });
          setDeviceBlocked(false);
        }

        // Log access
        await supabase.from("access_logs").insert({
          user_id: user.id,
          action: "login",
          device_fingerprint: fingerprint,
          details: `Acesso via ${deviceInfo}`,
        });
      } catch (err) {
        console.error("Device validation error:", err);
      }
      setLoading(false);
    };

    validateDevice();
  }, [user?.id]);

  const forceLogout = async () => {
    if (user) {
      const fingerprint = generateDeviceFingerprint();
      await supabase
        .from("device_sessions")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("device_fingerprint", fingerprint);
    }
    await signOut();
  };

  return { deviceBlocked, loading, forceLogout };
}
