-- Update Profiles Tabela
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;

-- Create Users Devices Tabela (For max 1 device validation)
CREATE TABLE IF NOT EXISTS public.users_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_info TEXT, -- User agent details
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, device_id)
);

-- Force limit constraint conceptually via Trigger or UI logic.
-- We will use application logic to count devices.

-- Create Access Logs Table 
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT,
    action TEXT NOT NULL, -- 'LOGIN', 'LOGOUT', 'BLOCKED_LIMIT', 'EXPIRED_SUB'
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Permissões (RLS)
ALTER TABLE public.users_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Usuários comuns podem ver apenas seus próprios devices
CREATE POLICY "Users can view their own devices" 
    ON public.users_devices FOR SELECT 
    USING (auth.uid() = user_id);

-- Usuários comuns podem registrar seu próprio device (Insert/Update)
CREATE POLICY "Users can insert their own devices" 
    ON public.users_devices FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices" 
    ON public.users_devices FOR UPDATE 
    USING (auth.uid() = user_id);

-- Usuários comuns podem ver seus próprios logs e inserir logs
CREATE POLICY "Users can view their own logs" 
    ON public.access_logs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert logs" 
    ON public.access_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- O Admin total é definido via "user_roles" tabela (como já existe `role = 'admin'`). 
-- Adicione Policies para os Admins lerem/alterarem QUALQUER COISA:
-- (Obs: Para ser super simplista e não engessar o script, 
-- utilizaremos service_role key no Edge functions ou o painel Admin usará queries via RLS ignorando caso necessário, 
-- ou definimos uma policy baseada em `user_roles`)

CREATE POLICY "Admins can do everything on devices"
    ON public.users_devices FOR ALL
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can view all logs"
    ON public.access_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
    
CREATE POLICY "Admins can update profiles"
    ON public.profiles FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
