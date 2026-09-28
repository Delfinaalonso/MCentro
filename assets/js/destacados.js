/* Materiales Centro — sección "Destacados": productos reales del catálogo
   marcados destacado:true, filtrados por rubro (data-rubro en el
   contenedor), con alta directa al carrito único. Se usa en Terminaciones
   y Corralón. */
(function(){
  var grid = document.querySelector('[data-destacados-grid]');
  if(!grid) return;
  var rubro = grid.getAttribute('data-rubro') || '';

  function formatMoney(n){ return '$' + Number(n).toLocaleString('es-AR'); }

  fetch('assets/data/productos.json')
    .then(function(res){ return res.json(); })
    .then(function(data){
      var destacados = (data.productos || [])
        .filter(function(p){ return p.activo && p.destacado && (!rubro || p.rubro === rubro); })
        .sort(function(a, b){ return (a.orden || 0) - (b.orden || 0); })
        .slice(0, 5);

      destacados.forEach(function(p){
        var card = document.createElement('div');
        card.className = 'dest-card';
        card.innerHTML =
          '<div class="dc-media"><img src="' + p.foto + '" alt="' + p.nombre + '"></div>' +
          '<div class="dc-body">' +
            '<span class="dc-tag">' + p.subcategoriaLabel + '</span>' +
            '<h3>' + p.nombre + '</h3>' +
            '<span class="dc-price">' + (p.precio ? formatMoney(p.precio) : 'Precio a confirmar') + '</span>' +
            '<button type="button" class="dc-add" data-dc-add>Agregar a mi pedido</button>' +
          '</div>';

        var addBtn = card.querySelector('[data-dc-add]');
        addBtn.addEventListener('click', function(){
          MCCart.add({ id: p.id, tipo: 'producto', nombre: p.nombre, unidad: p.unidad, precio: p.precio || 0, cantidad: 1 });
          addBtn.textContent = 'Agregado ✓';
          addBtn.classList.add('added');
          setTimeout(function(){
            addBtn.textContent = 'Agregar a mi pedido';
            addBtn.classList.remove('added');
          }, 1200);
        });

        grid.appendChild(card);
      });
    })
    .catch(function(err){ console.error('No se pudieron cargar los destacados', err); });
})();
