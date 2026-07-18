-- Seed: Loan Products (dummy for testing)
-- Copy & run in Supabase SQL Editor or apply via migration

insert into loan_products (name, description, profit_rate_percent, min_amount_myr, max_amount_myr, min_tenure_months, max_tenure_months, sector_tags, active)
values
('Pembiayaan Mikro MARA', 'Pembiayaan mikro untuk usahawan kecil dan mikro di bawah seliaan MARA.', 4.0, 1000, 50000, 6, 60, ARRAY['runcit', 'perkhidmatan', 'makanan'], true),
('Skim Pembiayaan Usahawan Bumiputera (SPIKE)', 'Pembiayaan untuk usahawan Bumiputera yang ingin mengembangkan perniagaan sedia ada.', 3.5, 5000, 250000, 12, 84, ARRAY['pembuatan', 'teknologi', 'perkhidmatan'], true),
('Pembiayaan Premium MARA', 'Pembiayaan untuk usahawan yang telah mempunyai rekod perniagaan kukuh.', 4.5, 10000, 500000, 12, 120, ARRAY['pembuatan', 'teknologi', 'pembinaan'], true),
('Skim Pembiayaan Kontraktor Bumiputera', 'Pembiayaan khas untuk kontraktor Bumiputera berdaftar CIDB/SSM.', 5.0, 20000, 1000000, 12, 120, ARRAY['pembinaan', 'perkhidmatan'], true),
('Pembiayaan Agro Makanan MARA', 'Pembiayaan sektor agro makanan untuk usahawan Bumiputera.', 3.0, 5000, 300000, 6, 96, ARRAY['makanan', 'pertanian'], true)
on conflict do nothing;
