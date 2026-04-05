import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Shield, ShieldAlert, MonitorCheck, Loader2, RefreshCcw, UserX, CalendarPlus, Activity, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    // Fetch profiles
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, name, subscription_status, subscription_ends_at');
      
    // Fetch attached devices map
    const { data: dData } = await (supabase as any)
      .from('users_devices')
      .select('*');

    // Fetch logs
    const { data: logsData } = await (supabase as any)
      .from('access_logs')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (profiles) setUsers(profiles);
    if (dData) setDevices(dData);
    if (logsData) setLogs(logsData);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  if (roleLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 animate-spin" /></div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleToggleSub = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await (supabase as any).from('profiles').update({
      subscription_status: newStatus
    }).eq('id', userId);
    if (!error) {
       toast.success("Assinatura " + newStatus);
       fetchAdminData();
    } else {
       toast.error("Erro.");
    }
  };

  const handleClearDevices = async (userId: string) => {
    const { error } = await (supabase as any).from('users_devices').delete().eq('user_id', userId);
    if (!error) {
       toast.success("Dispositivos resetados! O usuário poderá fazer login em 1 novo aparelho.");
       fetchAdminData();
    } else {
       toast.error("Erro ao resetar");
    }
  };

  const handleAddDays = async (userId: string, currentEndDate: string) => {
    const baseDate = currentEndDate ? new Date(currentEndDate) : new Date();
    if (baseDate < new Date()) baseDate.setTime(new Date().getTime());
    
    const newDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const { error } = await (supabase as any).from('profiles').update({
      subscription_status: 'active',
      subscription_ends_at: newDate.toISOString()
    }).eq('id', userId);
    
    if (!error) {
       toast.success("+30 Dias Adicionados!");
       fetchAdminData();
    } else {
       toast.error("Erro ao adicionar dias");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Painel de Segurança VIP</h1>
          </div>
          <button onClick={fetchAdminData} className="flex gap-2 items-center text-sm bg-secondary px-3 py-2 rounded">
            <RefreshCcw className="w-4 h-4" /> Atualizar
          </button>
        </div>

        <div className="flex border-b border-border mb-6">
          <button 
            onClick={() => setActiveTab('users')} 
            className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === 'users' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}`}
          >
            <Users className="w-4 h-4" /> Gestão de Usuários
          </button>
          <button 
            onClick={() => setActiveTab('logs')} 
            className={`px-4 py-2 font-medium flex items-center gap-2 ${activeTab === 'logs' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}`}
          >
            <Activity className="w-4 h-4" /> Logs de Acesso
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="border border-border bg-card p-4 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full"><Users className="w-6 h-6 text-primary" /></div>
                <div><p className="text-2xl font-bold">{users.length}</p><p className="text-sm text-muted-foreground">Usuários Cadastrados</p></div>
              </div>
              <div className="border border-border bg-card p-4 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full"><MonitorCheck className="w-6 h-6 text-primary" /></div>
                <div><p className="text-2xl font-bold">{devices.length}</p><p className="text-sm text-muted-foreground">Aparelhos Vinculados</p></div>
              </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 animate-spin" /></div>
        ) : (
          activeTab === 'users' ? (
            <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden max-w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-secondary/50 text-sm p-4">
                    <th className="p-4 border-b border-border font-medium">Usuário</th>
                    <th className="p-4 border-b border-border font-medium">Assinatura</th>
                    <th className="p-4 border-b border-border font-medium">Segurança de Tela</th>
                    <th className="p-4 border-b border-border font-medium text-right">Controles</th>
                  </tr>
                </thead>
                <motion.tbody>
                  {users.map(u => {
                    const userDevices = devices.filter(d => d.user_id === u.id);
                    const isExpired = u.subscription_ends_at && new Date(u.subscription_ends_at) < new Date();
                    
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold">{u.name || 'Sem Nome'}</p>
                          <p className="text-xs text-muted-foreground max-w-[120px] truncate" title={u.id}>{u.id}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2 py-1 text-xs rounded-full w-fit ${u.subscription_status === 'active' && !isExpired ? 'bg-green-500/10 text-green-500 font-medium' : 'bg-red-500/10 text-red-500 font-medium'}`}>
                              {u.subscription_status === 'active' && !isExpired ? 'Ativo' : 'Inativa/Expirada'}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-medium bg-secondary px-2 py-0.5 rounded border border-border">
                              Vence: {u.subscription_ends_at ? format(new Date(u.subscription_ends_at), 'dd/MM/yyyy') : 'Não Definido'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                           {userDevices.length > 0 ? (
                             <div className="flex flex-col text-xs text-muted-foreground">
                               <span className="text-red-500 font-medium">🔒 1 Aparelho Travado</span>
                               <span className="truncate max-w-[150px] opacity-70 mt-0.5" title={userDevices[0].device_info}>{userDevices[0].device_info}</span>
                             </div>
                           ) : (
                             <span className="text-xs text-green-500 font-medium opacity-80">✅ Livre para Logar</span>
                           )}
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                           <button onClick={() => handleAddDays(u.id, u.subscription_ends_at)} className="p-2 border border-border rounded hover:bg-secondary transition" title="Adicionar +30 Dias de Licença">
                             <CalendarPlus className="w-4 h-4 text-blue-500" />
                           </button>
                           <button onClick={() => handleClearDevices(u.id)} disabled={userDevices.length === 0} className="p-2 border border-border rounded disabled:opacity-30 hover:bg-secondary transition" title="Destravar/Resetar Aparelho (Permitir novo login)">
                             <MonitorCheck className="w-4 h-4 text-orange-500" />
                           </button>
                           <button onClick={() => handleToggleSub(u.id, u.subscription_status)} className="p-2 border border-border rounded hover:bg-secondary transition" title="Pausar/Ativar Acesso Permanente (Manual)">
                             <UserX className="w-4 h-4 text-red-500" />
                           </button>
                        </td>
                      </tr>
                    )
                  })}
                </motion.tbody>
              </table>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden max-w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-secondary/50 text-sm p-4">
                    <th className="p-4 border-b border-border font-medium">Data / Hora</th>
                    <th className="p-4 border-b border-border font-medium">Usuário</th>
                    <th className="p-4 border-b border-border font-medium">Ação Desencadeada</th>
                    <th className="p-4 border-b border-border font-medium">Device Token</th>
                  </tr>
                </thead>
                <motion.tbody>
                  {logs.map((log, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-4 text-xs text-muted-foreground font-mono">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                      </td>
                      <td className="p-4 text-sm font-medium">
                        {log.profiles?.name || <span className="text-xs text-muted-foreground">{log.user_id}</span>}
                      </td>
                      <td className="p-4 text-sm font-medium">
                        {log.action === 'LOGIN' && <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded">Acesso Autorizado</span>}
                        {log.action === 'BLOCKED_LIMIT' && <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded">Bloqueio: Multi-Aparelho!</span>}
                        {log.action === 'EXPIRED_SUB' && <span className="text-orange-500 bg-orange-500/10 px-2 py-1 rounded">Bloqueio: Assinatura Inativa</span>}
                        {log.action !== 'LOGIN' && log.action !== 'BLOCKED_LIMIT' && log.action !== 'EXPIRED_SUB' && <span className="text-foreground">{log.action}</span>}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground font-mono opacity-60">
                        {log.device_id?.substring(0, 12)}...
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum evento registrado no sistema de monitoramento.</td>
                    </tr>
                  )}
                </motion.tbody>
              </table>
            </div>
          )
        )}

      </div>
    </div>
  );
}
