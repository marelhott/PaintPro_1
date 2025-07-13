-- Tabulka pro uživatele (nový jednoduchý systém)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    color TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabulka pro zakázky (aktualizovaná)
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    datum TEXT NOT NULL,
    druh TEXT NOT NULL,
    klient TEXT,
    cislo TEXT NOT NULL,
    castka NUMERIC DEFAULT 0,
    fee NUMERIC DEFAULT 0,
    material NUMERIC DEFAULT 0,
    pomocnik NUMERIC DEFAULT 0,
    palivo NUMERIC DEFAULT 0,
    adresa TEXT,
    typ TEXT DEFAULT 'byt',
    doba_realizace INTEGER DEFAULT 1,
    poznamka TEXT,
    soubory JSONB DEFAULT '[]'::jsonb,
    zisk NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexy pro výkon
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Politiky pro přístup k datům
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for all users" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable update for all users" ON public.users
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Enable delete for all users" ON public.users
    FOR DELETE USING (true);

CREATE POLICY IF NOT EXISTS "Enable read access for all orders" ON public.orders
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Enable insert for all orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable update for all orders" ON public.orders
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Enable delete for all orders" ON public.orders
    FOR DELETE USING (true);