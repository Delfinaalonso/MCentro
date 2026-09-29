/* Materiales Centro — flip cards táctiles: en touch (sin hover), el primer
   tap flipea la card y el tap afuera la vuelve a su frente. Se usa en todas
   las páginas que tienen grillas .lineas-grid (Terminaciones, Corralón,
   las 4 categorías sin catálogo real). */
(function(){
  var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if(!isTouchDevice) return;
  document.querySelectorAll('.linea-box').forEach(function(card){
    card.addEventListener('click', function(){
      document.querySelectorAll('.linea-box').forEach(function(c){ if(c!==card) c.classList.remove('flipped'); });
      card.classList.toggle('flipped');
    });
  });
})();
