/* Materiales Centro — "Mi pedido": carrito único compartido entre páginas.
   Persiste en localStorage. Alimenta el contador del header, la barra fija
   de abajo y pedido.html, y arma el mensaje final de WhatsApp. */
var MCCart = (function(){
  var KEY = 'mc_cart_v1';
  var WHATSAPP_NUMBER = '5492302634844';
  var MAX_ITEMS_IN_MESSAGE = 40;

  function read(){
    try{
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function write(items){
    try{ localStorage.setItem(KEY, JSON.stringify(items)); }catch(e){}
    render();
    document.dispatchEvent(new CustomEvent('mc-cart-change', { detail: { items: items } }));
  }

  // item: {id, tipo:'producto'|'consulta', nombre, unidad, precio, cantidad, nota}
  function add(item){
    var items = read();
    if(item.tipo === 'producto'){
      var existing = items.find(function(i){ return i.tipo === 'producto' && i.id === item.id; });
      if(existing){ existing.cantidad += (item.cantidad || 1); }
      else{ items.push(Object.assign({ cantidad: 1 }, item)); }
    } else {
      // consulta libre: cada una es su propio ítem (no se acumulan entre sí)
      items.push(Object.assign({ id: item.id || ('consulta-' + Date.now() + '-' + Math.random().toString(36).slice(2,7)), cantidad: 1 }, item));
    }
    write(items);
  }
  function remove(id){
    write(read().filter(function(i){ return i.id !== id; }));
  }
  function updateQty(id, qty){
    var items = read();
    var it = items.find(function(i){ return i.id === id; });
    if(!it) return;
    it.cantidad = Math.max(1, qty|0);
    write(items);
  }
  function clear(){ write([]); }
  function getItems(){ return read(); }
  function getCount(){
    return read().reduce(function(sum, i){ return sum + (i.cantidad || 1); }, 0);
  }
  function getTotal(){
    return read().reduce(function(sum, i){
      return sum + (i.tipo === 'producto' ? (Number(i.precio) || 0) * (i.cantidad || 1) : 0);
    }, 0);
  }

  function formatMoney(n){
    return '$' + Number(n).toLocaleString('es-AR');
  }

  function buildWhatsAppMessage(){
    var items = read();
    var lines = ['Hola! Te paso mi pedido de Materiales Centro:', ''];
    items.slice(0, MAX_ITEMS_IN_MESSAGE).forEach(function(i){
      if(i.tipo === 'producto'){
        lines.push('• ' + i.nombre + ' — ' + i.cantidad + ' ' + (i.unidad || 'un.') + (i.precio ? ' (' + formatMoney(i.precio * i.cantidad) + ')' : ''));
      } else {
        lines.push('• ' + i.nombre + ': ' + i.nota);
      }
    });
    if(items.length > MAX_ITEMS_IN_MESSAGE){
      lines.push('', '(+' + (items.length - MAX_ITEMS_IN_MESSAGE) + ' ítems más — te paso el resto por acá mismo)');
    }
    var total = getTotal();
    if(total > 0){ lines.push('', 'Total estimado: ' + formatMoney(total)); }
    lines.push('', '¿Me confirmás disponibilidad?');
    return lines.join('\n');
  }

  function sendWhatsApp(){
    var text = encodeURIComponent(buildWhatsAppMessage());
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text, '_blank');
  }

  function render(){
    var count = getCount();
    var visible = count > 0;

    document.querySelectorAll('[data-cart-count]').forEach(function(el){
      el.style.display = visible ? '' : 'none';
      var n = el.querySelector('.n');
      if(n) n.textContent = count;
    });

    document.querySelectorAll('[data-cart-bar]').forEach(function(el){
      el.classList.toggle('visible', visible);
    });
    document.querySelectorAll('[data-cart-count-text]').forEach(function(el){
      el.textContent = 'Tu pedido (' + count + ')';
    });
  }

  function wireSendButtons(){
    document.querySelectorAll('[data-cart-send]').forEach(function(btn){
      if(btn.dataset.mcWired) return;
      btn.dataset.mcWired = '1';
      btn.addEventListener('click', sendWhatsApp);
    });
  }

  // formulario "¿Qué necesitás?" de las categorías sin catálogo real:
  // <form data-necesitas="Nombre categoría"><textarea data-necesitas-text>
  // <button data-necesitas-add> / <button data-necesitas-send></form>
  function wireNecesitasForms(){
    document.querySelectorAll('[data-necesitas]').forEach(function(form){
      if(form.dataset.mcWired) return;
      form.dataset.mcWired = '1';
      form.addEventListener('submit', function(e){
        e.preventDefault();
        var textarea = form.querySelector('[data-necesitas-text]');
        var text = textarea && textarea.value.trim();
        if(!text) return;
        add({ tipo: 'consulta', nombre: form.getAttribute('data-necesitas'), nota: text });
        textarea.value = '';
        if(e.submitter && e.submitter.hasAttribute('data-necesitas-send')){ sendWhatsApp(); }
      });
    });
  }

  function init(){
    render();
    wireSendButtons();
    wireNecesitasForms();
    window.addEventListener('storage', function(e){ if(e.key === KEY) render(); });
  }

  if(window.includesReady && typeof window.includesReady.then === 'function'){
    window.includesReady.then(init);
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  return {
    add: add, remove: remove, updateQty: updateQty, clear: clear,
    getItems: getItems, getCount: getCount, getTotal: getTotal,
    buildWhatsAppMessage: buildWhatsAppMessage, sendWhatsApp: sendWhatsApp,
    render: render, wireSendButtons: wireSendButtons
  };
})();
