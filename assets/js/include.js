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
  });
})();
