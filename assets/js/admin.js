/* Materiales Centro — panel de administración de productos.
   Requiere que assets/js/supabase-client.js tenga SUPABASE_URL y
   SUPABASE_ANON_KEY completos. El acceso real lo protege Supabase Auth +
   las políticas de RLS del lado de la base (ver supabase/schema.sql) —
   esta página es solo la interfaz, no la seguridad. */
(function () {
  var sb = MCData.getClient();

  var loginView = document.getElementById('loginView');
  var appView = document.getElementById('appView');
  var loginForm = document.getElementById('loginForm');
  var loginMsg = document.getElementById('loginMsg');
  var logoutBtn = document.getElementById('logoutBtn');
  var productsBody = document.getElementById('productsBody');
  var emptyMsg = document.getElementById('emptyMsg');
  var listMsg = document.getElementById('listMsg');
  var newProductBtn = document.getElementById('newProductBtn');
  var modalBackdrop = document.getElementById('modalBackdrop');
  var modalTitle = document.getElementById('modalTitle');
  var productForm = document.getElementById('productForm');
  var formMsg = document.getElementById('formMsg');
  var cancelModalBtn = document.getElementById('cancelModalBtn');
  var pRubro = document.getElementById('pRubro');
  var pSubcategoria = document.getElementById('pSubcategoria');
  var pUnidad = document.getElementById('pUnidad');
  var pUnidadOtra = document.getElementById('pUnidadOtra');
  var pFoto = document.getElementById('pFoto');
  var pFotoFile = document.getElementById('pFotoFile');
  var pFotoPreview = document.getElementById('pFotoPreview');
  var fotoMsg = document.getElementById('fotoMsg');
  var UNIDADES_CONOCIDAS = ['unidad', 'bolsa', 'm2', 'metro', 'kg', 'litro', 'rollo', 'caja', 'par', 'juego'];

  var categories = []; // {id, slug, nombre, parent_id, orden}
  var products = [];

  if (!sb) {
    loginMsg.textContent = 'Falta configurar Supabase (completar SUPABASE_URL y SUPABASE_ANON_KEY en assets/js/supabase-client.js).';
    loginMsg.className = 'msg error';
    return;
  }

  function rubros() {
    return categories.filter(function (c) { return !c.parent_id; }).sort(function (a, b) { return a.orden - b.orden; });
  }
  function subcategorias(rubroId) {
    return categories.filter(function (c) { return c.parent_id === rubroId; }).sort(function (a, b) { return a.orden - b.orden; });
  }
  function categoriaNombre(id) {
    var c = categories.filter(function (x) { return x.id === id; })[0];
    return c ? c.nombre : '';
  }

  function showApp() {
    loginView.style.display = 'none';
    appView.style.display = 'block';
    loadAll();
  }
  function showLogin(msg) {
    appView.style.display = 'none';
    loginView.style.display = 'block';
    if (msg) { loginMsg.textContent = msg; loginMsg.className = 'msg error'; }
  }

  sb.auth.getSession().then(function (res) {
    if (res.data && res.data.session) showApp();
    else showLogin();
  });

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    loginMsg.textContent = '';
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      if (res.error) {
        loginMsg.textContent = 'No pudimos ingresar: ' + res.error.message;
        loginMsg.className = 'msg error';
        return;
      }
      showApp();
    });
  });

  logoutBtn.addEventListener('click', function () {
    sb.auth.signOut().then(function () { showLogin(); });
  });

  function loadAll() {
    listMsg.textContent = 'Cargando...';
    Promise.all([
      sb.from('categories').select('*'),
      sb.from('products').select('*').order('orden'),
    ]).then(function (results) {
      var catRes = results[0], prodRes = results[1];
      if (catRes.error || prodRes.error) {
        listMsg.textContent = 'Error al cargar: ' + ((catRes.error || prodRes.error).message);
        listMsg.className = 'msg error';
        return;
      }
      categories = catRes.data || [];
      products = prodRes.data || [];
      listMsg.textContent = '';
      fillRubroSelect();
      renderProducts();
    });
  }

  function fillRubroSelect() {
    pRubro.innerHTML = '';
    rubros().forEach(function (r) {
      var opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.nombre;
      pRubro.appendChild(opt);
    });
    fillSubcategoriaSelect();
  }
  function fillSubcategoriaSelect() {
    pSubcategoria.innerHTML = '<option value="">(sin subcategoría)</option>';
    subcategorias(pRubro.value).forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.nombre;
      pSubcategoria.appendChild(opt);
    });
  }
  pRubro.addEventListener('change', fillSubcategoriaSelect);

  pUnidad.addEventListener('change', function () {
    pUnidadOtra.style.display = pUnidad.value === 'otra' ? 'block' : 'none';
  });

  function setUnidadSelect(valor) {
    var v = (valor || 'unidad').trim();
    if (UNIDADES_CONOCIDAS.indexOf(v) !== -1) {
      pUnidad.value = v;
      pUnidadOtra.style.display = 'none';
      pUnidadOtra.value = '';
    } else {
      pUnidad.value = 'otra';
      pUnidadOtra.style.display = 'block';
      pUnidadOtra.value = v;
    }
  }
  function getUnidadValue() {
    return pUnidad.value === 'otra' ? (pUnidadOtra.value.trim() || 'unidad') : pUnidad.value;
  }

  pFotoFile.addEventListener('change', function () {
    var file = pFotoFile.files && pFotoFile.files[0];
    if (!file) return;
    fotoMsg.textContent = 'Subiendo...';
    fotoMsg.className = 'msg';
    var path = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    sb.storage.from('product-photos').upload(path, file, { upsert: false }).then(function (res) {
      if (res.error) {
        fotoMsg.textContent = 'No se pudo subir la foto: ' + res.error.message;
        fotoMsg.className = 'msg error';
        return;
      }
      var pub = sb.storage.from('product-photos').getPublicUrl(res.data.path);
      pFoto.value = pub.data.publicUrl;
      pFotoPreview.src = pub.data.publicUrl;
      pFotoPreview.style.display = 'block';
      fotoMsg.textContent = 'Foto subida ✓';
      fotoMsg.className = 'msg ok';
    });
  });

  function formatMoney(n) {
    if (n === null || n === undefined) return 'A confirmar';
    return '$' + Number(n).toLocaleString('es-AR');
  }

  function renderProducts() {
    productsBody.innerHTML = '';
    emptyMsg.style.display = products.length ? 'none' : 'block';
    products.forEach(function (p) {
      var tr = document.createElement('tr');

      var tdFoto = document.createElement('td');
      var img = document.createElement('img');
      img.src = p.foto || '';
      img.alt = '';
      tdFoto.appendChild(img);
      tr.appendChild(tdFoto);

      var tdNombre = document.createElement('td');
      tdNombre.textContent = p.nombre;
      tr.appendChild(tdNombre);

      var tdCat = document.createElement('td');
      tdCat.textContent = categoriaNombre(p.rubro_id) + (p.subcategoria_id ? ' / ' + categoriaNombre(p.subcategoria_id) : '');
      tr.appendChild(tdCat);

      var tdPrecio = document.createElement('td');
      tdPrecio.textContent = formatMoney(p.precio);
      tr.appendChild(tdPrecio);

      var tdStock = document.createElement('td');
      var ctrl = document.createElement('div');
      ctrl.className = 'stock-ctrl';
      var minus = document.createElement('button');
      minus.type = 'button'; minus.textContent = '–';
      var stockVal = document.createElement('span');
      stockVal.textContent = p.stock;
      var plus = document.createElement('button');
      plus.type = 'button'; plus.textContent = '+';
      minus.addEventListener('click', function () { adjustStock(p, -1); });
      plus.addEventListener('click', function () { adjustStock(p, 1); });
      ctrl.appendChild(minus); ctrl.appendChild(stockVal); ctrl.appendChild(plus);
      tdStock.appendChild(ctrl);
      tr.appendChild(tdStock);

      var tdDest = document.createElement('td');
      var destChk = document.createElement('input');
      destChk.type = 'checkbox'; destChk.checked = !!p.destacado;
      destChk.addEventListener('change', function () {
        sb.from('products').update({ destacado: destChk.checked }).eq('id', p.id).then(function (res) {
          if (res.error) { alert('No se pudo guardar: ' + res.error.message); destChk.checked = !destChk.checked; }
          else { p.destacado = destChk.checked; }
        });
      });
      tdDest.appendChild(destChk);
      tr.appendChild(tdDest);

      var tdActivo = document.createElement('td');
      var activoChk = document.createElement('input');
      activoChk.type = 'checkbox'; activoChk.checked = !!p.activo;
      activoChk.addEventListener('change', function () {
        var next = activoChk.checked;
        if (!next && !confirm('¿Desactivar "' + p.nombre + '"? Deja de verse en la web, pero no se borra.')) {
          activoChk.checked = true;
          return;
        }
        sb.from('products').update({ activo: next }).eq('id', p.id).then(function (res) {
          if (res.error) { alert('No se pudo guardar: ' + res.error.message); activoChk.checked = !next; }
          else { p.activo = next; }
        });
      });
      tdActivo.appendChild(activoChk);
      tr.appendChild(tdActivo);

      var tdEdit = document.createElement('td');
      var editBtn = document.createElement('button');
      editBtn.type = 'button'; editBtn.className = 'btn btn-outline btn-sm'; editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', function () { openModal(p); });
      tdEdit.appendChild(editBtn);
      tr.appendChild(tdEdit);

      productsBody.appendChild(tr);
    });
  }

  function adjustStock(p, delta) {
    var nuevoStock = Math.max(0, (p.stock || 0) + delta);
    sb.from('stock_movements').insert({
      product_id: p.id, tipo: 'ajuste', cantidad: delta, nota: 'Ajuste manual desde el panel',
    }).then(function (movRes) {
      if (movRes.error) { alert('No se pudo registrar el movimiento: ' + movRes.error.message); return; }
      sb.from('products').update({ stock: nuevoStock }).eq('id', p.id).then(function (res) {
        if (res.error) { alert('No se pudo actualizar el stock: ' + res.error.message); return; }
        p.stock = nuevoStock;
        renderProducts();
      });
    });
  }

  function openModal(p) {
    formMsg.textContent = '';
    document.getElementById('pId').value = p ? p.id : '';
    modalTitle.textContent = p ? 'Editar producto' : 'Nuevo producto';
    document.getElementById('pNombre').value = p ? p.nombre : '';
    document.getElementById('pMarca').value = p ? (p.marca || '') : '';
    setUnidadSelect(p ? p.unidad : 'unidad');
    document.getElementById('pDescripcion').value = p ? (p.descripcion || '') : '';
    document.getElementById('pPrecio').value = p && p.precio !== null ? p.precio : '';
    document.getElementById('pStock').value = p ? p.stock : 0;
    pFoto.value = p ? (p.foto || '') : '';
    pFotoFile.value = '';
    fotoMsg.textContent = '';
    if (p && p.foto) {
      pFotoPreview.src = p.foto;
      pFotoPreview.style.display = 'block';
    } else {
      pFotoPreview.style.display = 'none';
    }
    document.getElementById('pDestacado').checked = p ? !!p.destacado : false;
    fillRubroSelect();
    if (p) {
      pRubro.value = p.rubro_id;
      fillSubcategoriaSelect();
      pSubcategoria.value = p.subcategoria_id || '';
    }
    modalBackdrop.classList.add('open');
  }
  function closeModal() { modalBackdrop.classList.remove('open'); }

  newProductBtn.addEventListener('click', function () { openModal(null); });
  cancelModalBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', function (e) { if (e.target === modalBackdrop) closeModal(); });

  productForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = document.getElementById('pId').value;
    var precioVal = document.getElementById('pPrecio').value;
    var payload = {
      nombre: document.getElementById('pNombre').value.trim(),
      marca: document.getElementById('pMarca').value.trim() || null,
      unidad: getUnidadValue(),
      descripcion: document.getElementById('pDescripcion').value.trim() || null,
      precio: precioVal === '' ? null : Number(precioVal),
      foto: pFoto.value.trim() || null,
      destacado: document.getElementById('pDestacado').checked,
      rubro_id: pRubro.value,
      subcategoria_id: pSubcategoria.value || null,
    };

    if (id) {
      var existing = products.filter(function (x) { return x.id === id; })[0];
      var nuevoStockVal = Number(document.getElementById('pStock').value) || 0;
      sb.from('products').update(payload).eq('id', id).then(function (res) {
        if (res.error) { formMsg.textContent = res.error.message; formMsg.className = 'msg error'; return; }
        if (existing && nuevoStockVal !== existing.stock) {
          sb.from('stock_movements').insert({
            product_id: id, tipo: 'ajuste', cantidad: nuevoStockVal - existing.stock, nota: 'Edición manual del producto',
          }).then(function () {
            sb.from('products').update({ stock: nuevoStockVal }).eq('id', id).then(function () {
              closeModal(); loadAll();
            });
          });
        } else {
          closeModal(); loadAll();
        }
      });
    } else {
      payload.stock = Number(document.getElementById('pStock').value) || 0;
      payload.activo = true;
      sb.from('products').insert(payload).select().then(function (res) {
        if (res.error) { formMsg.textContent = res.error.message; formMsg.className = 'msg error'; return; }
        var created = res.data && res.data[0];
        if (created && payload.stock) {
          sb.from('stock_movements').insert({
            product_id: created.id, tipo: 'ingreso', cantidad: payload.stock, nota: 'Alta de producto',
          }).then(function () { closeModal(); loadAll(); });
        } else {
          closeModal(); loadAll();
        }
      });
    }
  });
})();
