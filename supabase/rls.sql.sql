-- =========================================================
-- supabase-rls.sql — Seguridad de la tabla "mensajes"
-- Ejecutar en Supabase → SQL Editor.
--
-- ⚠️ ANTES: cambia TU_EMAIL_ADMIN por el correo con el que
--    entras en admin.html (el usuario de Supabase Auth).
-- ⚠️ La clave "anon" de script.js es pública: esto es lo que
--    impide que cualquiera lea o borre los mensajes.
-- =========================================================

-- 0) Ver qué políticas tienes ahora (ejecútalo primero y revisa)
select policyname, cmd, roles, qual, with_check
from pg_policies
where tablename = 'mensajes';

-- 1) Activar RLS (sin políticas = nadie puede hacer nada)
alter table public.mensajes enable row level security;

-- 2) Borrar políticas antiguas con estos nombres (si existen).
--    Si en el paso 0 salen otras políticas permisivas
--    (p. ej. "Enable read access for all users"), bórralas también:
--    drop policy "NOMBRE_EXACTO" on public.mensajes;
drop policy if exists "anon_inserta_mensajes" on public.mensajes;
drop policy if exists "admin_lee_mensajes"    on public.mensajes;
drop policy if exists "admin_edita_mensajes"  on public.mensajes;
drop policy if exists "admin_borra_mensajes"  on public.mensajes;

-- 3) Visitantes anónimos: SOLO pueden insertar
--    (no pueden marcar "leido" ni inventarse la fecha)
create policy "anon_inserta_mensajes"
on public.mensajes for insert
to anon
with check (
  coalesce(leido, false) = false
);

-- 4) Solo tu cuenta puede leer, actualizar y borrar
create policy "admin_lee_mensajes"
on public.mensajes for select
to authenticated
using ( (auth.jwt() ->> 'email') = 'TU_EMAIL_ADMIN' );

create policy "admin_edita_mensajes"
on public.mensajes for update
to authenticated
using      ( (auth.jwt() ->> 'email') = 'TU_EMAIL_ADMIN' )
with check ( (auth.jwt() ->> 'email') = 'TU_EMAIL_ADMIN' );

create policy "admin_borra_mensajes"
on public.mensajes for delete
to authenticated
using ( (auth.jwt() ->> 'email') = 'TU_EMAIL_ADMIN' );

-- 5) Límites de longitud: frena spam y mensajes gigantes
--    (si ya tienes filas que no cumplen, el ALTER fallará: revísalas)
alter table public.mensajes drop constraint if exists mensajes_longitudes;
alter table public.mensajes add constraint mensajes_longitudes check (
      char_length(nombre) between 1 and 100
  and char_length(email)  between 3 and 254
  and char_length(coalesce(telefono, ''))       <= 30
  and char_length(coalesce(disponibilidad, '')) <= 60
  and char_length(coalesce(mensaje, ''))        <= 2000
);

-- 6) Valores por defecto (por si no estaban)
alter table public.mensajes alter column fecha set default now();
alter table public.mensajes alter column leido set default false;

-- =========================================================
-- 7) PRUEBA (en una ventana de incógnito, sin sesión):
--    - Enviar el formulario "¿Te llamo?"  → debe funcionar.
--    - En la consola del navegador:
--        fetch('https://kusmmtgvrecayytatvbf.supabase.co/rest/v1/mensajes?select=*',
--          { headers: { apikey: '<ANON_KEY>', Authorization: 'Bearer <ANON_KEY>' } })
--          .then(r => r.json()).then(console.log)
--      → debe devolver []  (lista vacía = nadie anónimo puede leer).
-- =========================================================
