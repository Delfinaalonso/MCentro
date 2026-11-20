/* Materiales Centro — sección "Destacados": productos reales del catálogo
   marcados destacado:true, filtrados por rubro (data-rubro en el
   contenedor), con alta directa al carrito único. Se usa en Terminaciones
   y Corralón. Incluye el mismo modal de descripción de producto (botón
   "i") que usa catalogo.html — se arma acá mismo con JS para no tener que
   repetir el markup del modal en cada página de categoría. */
(function(){
  var grid = document.querySelector('[data-destacados-grid]');
  if(!grid) return;
  var rubro = grid.getAttribute('data-rubro') || '';

  function formatMoney(n){ return '$' + Number(n).toLocaleString('es-AR'); }

  var pmBackdrop = document.querySelector('[data-pm-backdrop]');
  if(!pmBackdrop){
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="pm-backdrop" data-pm-backdrop>' +
        '<div class="pm-panel">' +
          '<button type="button" class="pm-close" data-pm-close aria-label="Cerrar">×</button>' +
          '<div class="pm-media"><img data-pm-img src="" alt="" /></div>' +
          '<div class="pm-body">' +
            '<span class="pm-tag" data-pm-tag></span>' +
            '<h2 data-pm-nombre></h2>' +
            '<span class="pm-price" data-pm-price></span>' +
            '<p class="pm-desc" data-pm-desc></p>' +
            '<div class="pm-actions">' +
              '<div class="cc-actions">' +
                '<div class="cc-stepper">' +
                  '<button type="button" data-pm-minus aria-label="Restar">−</button>' +
                  '<input type="number" min="1" value="1" data-pm-qty>' +
                  '<button type="button" data-pm-plus aria-label="Sumar">+</button>' +
                '</div>' +
                '<button type="button" class="btn btn-naranja cc-add" data-pm-add>Agregar</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap.firstChild);
    pmBackdrop = document.querySelector('[data-pm-backdrop]');
  }

  var pmImg = document.querySelector('[data-pm-img]');
  var pmTag = document.querySelector('[data-pm-tag]');
  var pmNombre = document.querySelector('[data-pm-nombre]');
  var pmPrice = document.querySelector('[data-pm-price]');
  var pmDesc = document.querySelector('[data-pm-desc]');
  var pmQty = document.querySelector('[data-pm-qty]');
  var pmAdd = document.querySelector('[data-pm-add]');

  function openProductModal(p){
    pmImg.src = p.foto || '';
    pmImg.alt = p.nombre;
    pmTag.textContent = p.subcategoriaLabel || '';
    pmNombre.textContent = p.nombre;
    pmPrice.textContent = p.precio ? formatMoney(p.precio) : 'Precio a confirmar';
    pmDesc.textContent = p.descripcion || 'Sin descripción disponible. Consultanos por WhatsApp si necesitás más detalle.';
    pmQty.value = 1;
    pmAdd.textContent = 'Agregar';
    pmAdd.classList.remove('added');
    pmAdd.onclick = function(){
      var qty = Math.max(1, parseInt(pmQty.value, 10) || 1);
      MCCart.add({ id: p.id, tipo: 'producto', nombre: p.nombre, unidad: p.unidad, precio: p.precio || 0, cantidad: qty });
      pmAdd.textContent = 'Agregado ✓';
      pmAdd.classList.add('added');
      setTimeout(function(){
        pmAdd.textContent = 'Agregar';
        pmAdd.classList.remove('added');
      }, 1200);
    };
    pmBackdrop.classList.add('open');
  }
  function closeProductModal(){ pmBackdrop.classList.remove('open'); }

  document.querySelector('[data-pm-close]').addEventListener('click', closeProductModal);
  pmBackdrop.addEventListener('click', function(e){ if(e.target === pmBackdrop) closeProductModal(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeProductModal(); });
  document.querySelector('[data-pm-minus]').addEventListener('click', function(){
    pmQty.value = Math.max(1, (parseInt(pmQty.value, 10) || 1) - 1);
  });
  document.querySelector('[data-pm-plus]').addEventListener('click', function(){
    pmQty.value = (parseInt(pmQty.value, 10) || 1) + 1;
  });

  MCData.getProductos()
    .then(function(data){
      var destacados = (data.productos || [])
        .filter(function(p){ return p.activo && p.destacado && (!rubro || p.rubro === rubro); })
        .sort(function(a, b){ return (a.orden || 0) - (b.orden || 0); })
        .slice(0, 5);

      destacados.forEach(function(p){
        var card = document.createElement('div');
        card.className = 'dest-card';
        card.innerHTML =
          '<div class="dc-media"><img src="' + p.foto + '" alt="' + p.nombre + '"><button type="button" class="cc-info" data-dc-info aria-label="Ver descripción">i</button></div>' +
          '<div class="dc-body">' +
            '<span class="dc-tag">' + p.subcategoriaLabel + '</span>' +
            '<h3>' + p.nombre + '</h3>' +
            '<span class="dc-price">' + (p.precio ? formatMoney(p.precio) : 'Precio a confirmar') + '</span>' +
            '<button type="button" class="dc-add" data-dc-add>Agregar a mi pedido</button>' +
          '</div>';

        card.querySelector('[data-dc-info]').addEventListener('click', function(){ openProductModal(p); });

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
