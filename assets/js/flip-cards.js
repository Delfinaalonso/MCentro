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

/* Si una grilla tiene pocas cards (p. ej. 5), que se achiquen lo necesario
   para entrar todas en una sola fila, en vez de dejar una sola "perdida"
   en la fila de abajo. Si son demasiadas para entrar en una fila aunque se
   achiquen al mínimo legible, se deja el wrap normal (como Corralón con 10). */
(function(){
  var MIN_CARD_WIDTH = 130;

  function fitOneRow(){
    document.querySelectorAll('.lineas-grid').forEach(function(grid){
      var cards = Array.prototype.filter.call(grid.children, function(c){
        return c.classList.contains('linea-box');
      });
      var count = cards.length;
      if(count < 2) return;

      cards.forEach(function(c){ c.style.flexBasis = ''; c.style.maxWidth = ''; });

      var gridStyle = getComputedStyle(grid);
      var gap = parseFloat(gridStyle.columnGap || gridStyle.gap) || 16;
      var maxCardWidth = parseFloat(getComputedStyle(cards[0]).maxWidth) || 250;
      var containerWidth = grid.clientWidth;
      if(!containerWidth) return;

      var maxCols = Math.floor((containerWidth + gap) / (maxCardWidth + gap));
      if(count <= maxCols) return; // ya entran todas en una fila al tamaño normal

      var colsAtMin = Math.floor((containerWidth + gap) / (MIN_CARD_WIDTH + gap));
      if(count > colsAtMin) return; // son demasiadas para una sola fila: wrap normal

      var basis = Math.min((containerWidth - (count - 1) * gap) / count, maxCardWidth);
      cards.forEach(function(c){
        c.style.flexBasis = basis + 'px';
        c.style.maxWidth = basis + 'px';
      });
    });
  }

  fitOneRow();
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(fitOneRow).catch(function(){}); }
  var t = null;
  window.addEventListener('resize', function(){
    clearTimeout(t);
    t = setTimeout(fitOneRow, 150);
  });
})();
