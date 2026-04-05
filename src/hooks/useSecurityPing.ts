import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { getOrCreateDeviceId, getDeviceInfo } from "@/lib/deviceTracking";
import { toast } from "sonner";

export function useSecurityPing() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    async function checkSecurity() {
      if (!user) return;
      const deviceId = getOrCreateDeviceId();

      if (!navigator.onLine) {
        toast.error("O aplicativo requer internet para validar sua licença.");
        signOut();
        return;
      }

      // 1. Check Subscription Status and Expiration
      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .select('subscription_status, subscription_ends_at')
        .eq('id', user.id)
        .single();
      
      if (!mounted) return;

      if (error || !profile) {
        // If there's a fetch error and we are supposedly online, might be session issue.
        return;
      }

      let isExpired = false;
      if (profile.subscription_status !== 'active') {
        isExpired = true;
      } else if (profile.subscription_ends_at) {
        const endDate = new Date(profile.subscription_ends_at);
        if (endDate < new Date()) {
          isExpired = true;
          // Auto-update to inactive behind the scenes
          await (supabase as any).from('profiles').update({ subscription_status: 'inactive' }).eq('id', user.id);
        }
      }

      if (isExpired) {
        toast.error("Acesso Negado: Sua assinatura expirou ou está inativa.");
        await logAction(user.id, deviceId, 'EXPIRED_SUB');
        signOut();
        return;
      }

      // 2. Register or fetch Device ID
      const { data: existingDevices } = await (supabase as any)
        .from('users_devices')
        .select('device_id')
        .eq('user_id', user.id);

      if (!mounted) return;

      if (existingDevices) {
        const hasThisDevice = existingDevices.some(d => d.device_id === deviceId);
        
        // Block if trying to login from a new device but max reached
        if (!hasThisDevice && existingDevices.length >= 1) {
          toast.error("Acesso Negado: Conta já vinculada a outro dispositivo automático. Entre em contato para resetar.");
          await logAction(user.id, deviceId, 'BLOCKED_LIMIT');
          signOut();
          return;
        }

        if (!hasThisDevice) {
           // Insert this new valid device
           await (supabase as any).from('users_devices').insert({
             user_id: user.id,
             device_id: deviceId,
             device_info: getDeviceInfo()
           });
        } else {
           // Update last seen
           await (supabase as any).from('users_devices').update({
             last_active: new Date().toISOString()
           }).eq('user_id', user.id).eq('device_id', deviceId);
        }
      }

      await logAction(user.id, deviceId, 'LOGIN');
    }

    checkSecurity();

    // Constant ping (every 2.5 minutes) to ensure they are still active and single-device valid
    const interval = setInterval(checkSecurity, 150000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user, signOut]);

  async function logAction(userId: string, deviceId: string, action: string) {
    try {
      await (supabase as any).from('access_logs').insert({
        user_id: userId,
        device_id: deviceId,
        action: action
        // IP backend via postgres is preferred, here relying on edge tracking if set up.
      });
    } catch (e) {
      console.error(e);
    }
  }
}
