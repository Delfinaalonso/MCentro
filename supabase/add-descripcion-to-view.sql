-- Materiales Centro — sumar la descripción a la vista pública de productos.
-- Correr esto en el SQL Editor de Supabase (es seguro de correr aunque la
-- vista ya exista: la reemplaza con la misma lógica más esta columna).

create or replace view products_public as
select
  p.id,
  p.nombre,
  p.descripcion,
  r.slug as rubro,
  r.nombre as "rubroLabel",
  s.slug as subcategoria,
  s.nombre as "subcategoriaLabel",
  p.unidad,
  p.precio,
  p.foto,
  p.destacado,
  p.activo,
  p.orden
from products p
join categories r on p.rubro_id = r.id
left join categories s on p.subcategoria_id = s.id
where p.activo = true;
