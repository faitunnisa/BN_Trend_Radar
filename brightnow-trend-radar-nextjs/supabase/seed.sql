-- Run this AFTER schema.sql.
-- Demo PINs:
-- Fathiya / Admin: 1234
-- Tia / Curator: 2468
-- Change both PINs from the Admin UI after the first login.

insert into public.divisions (name)
values
  ('Brand'),
  ('Digital & Media'),
  ('Creative'),
  ('E-commerce'),
  ('KOL & Community'),
  ('Consumer Insight'),
  ('Unassigned')
on conflict (name) do update set is_active = true;

insert into public.app_users (
  display_name, division_id, role, pin_hash, is_active
)
select
  'Fathiya',
  d.id,
  'admin',
  'scrypt$16384$8$1$teS-Z21gdEDUpKRwXFsCuA$fFcuOAPusiPA9iX-s8zyG0RNQpu062mQluYAeIEKYmr2mC6v_ErjAdn6AJLmFCOrvmOG8nEcJfroB-uuGfHqTw',
  true
from public.divisions d
where d.name = 'Digital & Media'
and not exists (
  select 1 from public.app_users where display_name = 'Fathiya'
);

insert into public.app_users (
  display_name, division_id, role, pin_hash, is_active
)
select
  'Tia',
  d.id,
  'curator',
  'scrypt$16384$8$1$4Y-hqyxz85wkBIitFUQpXg$_alfQndxtfo_euqmzvdCKzpoA8IoTIJvJL5zIQ9eIPZZJC_wtQ_kq0_qpgcqbc0thBU7buxd3pc_WgUMYOneyw',
  true
from public.divisions d
where d.name = 'Brand'
and not exists (
  select 1 from public.app_users where display_name = 'Tia'
);

insert into public.app_users (
  display_name, division_id, role, is_active
)
select x.display_name, d.id, 'contributor', true
from (
  values
    ('Nala', 'E-commerce'),
    ('Rara', 'Digital & Media'),
    ('Dinda', 'Creative'),
    ('Kahleav', 'KOL & Community')
) as x(display_name, division_name)
join public.divisions d on d.name = x.division_name
where not exists (
  select 1 from public.app_users u where u.display_name = x.display_name
);
