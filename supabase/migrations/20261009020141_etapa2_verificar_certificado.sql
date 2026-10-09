-- Verificación pública de certificados por su identificador (no adivinable).
-- Solo devuelve datos mínimos y la cédula enmascarada.
create or replace function public.verify_certificate(cert_id text)
returns table (consecutive text, full_name text, doc_masked text, status text, approved_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.consecutive,
         c.data->>'fullName',
         case when char_length(coalesce(c.data->>'docNumber','')) > 4
              then repeat('•', char_length(c.data->>'docNumber') - 4) || right(c.data->>'docNumber', 4)
              else '••••' end,
         c.status,
         c.approved_at
  from public.certificates c
  where c.id::text = cert_id and c.status = 'Aprobada'
  limit 1
$$;
revoke execute on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
