-- Materiales Centro — almacenamiento de fotos de productos.
-- Correr esto en el SQL Editor de Supabase DESPUÉS de schema.sql (una sola vez).

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

-- Cualquiera puede VER las fotos (son públicas, como las imágenes del sitio).
create policy "fotos de productos: lectura publica"
on storage.objects for select
using (bucket_id = 'product-photos');

-- Solo un usuario logueado (el panel de administración) puede subir, reemplazar
-- o borrar fotos.
create policy "fotos de productos: admin sube"
on storage.objects for insert
with check (bucket_id = 'product-photos' and auth.role() = 'authenticated');

create policy "fotos de productos: admin actualiza"
on storage.objects for update
using (bucket_id = 'product-photos' and auth.role() = 'authenticated');

create policy "fotos de productos: admin borra"
on storage.objects for delete
using (bucket_id = 'product-photos' and auth.role() = 'authenticated');
