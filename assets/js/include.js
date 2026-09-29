/* Materiales Centro — inyecta header/footer compartidos desde /partials
   y marca el link activo del nav según data-page en <body>. */
window.includesReady = (function(){
  function injectOne(el){
    var name = el.getAttribute('data-include');
    return fetch('partials/' + name + '.html')
      .then(function(res){ return res.text(); })
      .then(function(html){ el.outerHTML = html; })
      .catch(function(err){ console.error('No se pudo cargar el partial "' + name + '"', err); });
  }

  var targets = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));
  return Promise.all(targets.map(injectOne)).then(function(){
    var page = document.body.getAttribute('data-page');
    if(page){
      document.querySelectorAll('.main-nav a[data-page], .mobile-panel a[data-page]').forEach(function(a){
        if(a.getAttribute('data-page') === page) a.classList.add('on');
      });
    }

    /* El menú de escritorio no puede partirse en dos líneas bajo ningún
       motivo. En vez de confiar en un ancho de pantalla fijo (que depende
       de la tipografía real que haya cargado en cada navegador/dispositivo,
       y esa medida varió más de una vez), medimos el ancho real del <nav>
       ya renderizado: si no entra en una sola línea, pasamos a menú
       hamburguesa aunque la pantalla sea "de escritorio". Se re-chequea
       cuando terminan de cargar las tipografías y al cambiar el tamaño
       de ventana. */
    function checkNavFit(){
      var nav = document.querySelector('.main-nav');
      if(!nav) return;
      if(getComputedStyle(nav).display === 'none'){
        document.documentElement.classList.remove('nav-force-burger');
        return;
      }
      document.documentElement.classList.toggle('nav-force-burger', nav.scrollWidth > nav.clientWidth + 1);
    }
    checkNavFit();
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(checkNavFit).catch(function(){});
    }
    var navFitTimer = null;
    window.addEventListener('resize', function(){
      clearTimeout(navFitTimer);
      navFitTimer = setTimeout(checkNavFit, 150);
    });
  });
})();
