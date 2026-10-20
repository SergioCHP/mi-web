-- =========================================================
-- retencion.sql — Borrado automático de solicitudes antiguas
-- privacidad.html promete que las solicitudes del formulario
-- «¿Te llamo?» se borran como máximo a los 6 MESES. Esta tarea
-- lo cumple sola: cada noche borra las que han pasado ese plazo.
--
-- Ejecutar UNA VEZ en Supabase → SQL Editor.
-- ⚠️ Si cambias el plazo aquí, cámbialo también en privacidad.html,
--    js/privacidad.js y el aviso del formulario (js/script.js).
-- =========================================================

-- 1) Activar pg_cron (también se puede en Integrations → Cron)
create extension if not exists pg_cron with schema pg_catalog;

-- 2) Programar el borrado: todos los días a las 03:00 (hora UTC).
--    Si ya existe una tarea con este nombre, la actualiza.
select cron.schedule(
  'borrar-mensajes-antiguos',
  '0 3 * * *',
  $$ delete from public.mensajes where fecha < now() - interval '6 months' $$
);

-- 3) Comprobar que está programada (debe salir con active = true)
select jobid, jobname, schedule, command, active
from cron.job
where jobname = 'borrar-mensajes-antiguos';

-- ---------------------------------------------------------
-- Útil más adelante:
-- Ver las últimas ejecuciones:
--   select status, return_message, start_time
--   from cron.job_run_details order by start_time desc limit 5;
-- Quitar la tarea:
--   select cron.unschedule('borrar-mensajes-antiguos');
-- =========================================================
