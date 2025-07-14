
-- SQL pokyn pro přidání sloupce fee_off do tabulky orders
-- Spusťte tento příkaz v SQL Exploreru v Supabase

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS fee_off DECIMAL(10,2) DEFAULT 0;

-- Volitelně: Aktualizace existujících záznamů
-- Vypočítá fee_off jako rozdíl mezi celkovou částkou a fee
UPDATE public.orders 
SET fee_off = castka - fee 
WHERE fee_off = 0 OR fee_off IS NULL;

-- Ověření změny
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'fee_off';
