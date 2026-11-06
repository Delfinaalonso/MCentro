/* Materiales Centro — conexión a Supabase para productos.
   Completar SUPABASE_URL y SUPABASE_ANON_KEY (Project Settings → API en
   Supabase) cuando el proyecto esté creado. Ninguno de los dos es secreto —
   están pensados para vivir en el frontend; la seguridad real la dan las
   políticas de RLS del lado de la base, no esconder estos valores.

   Mientras estén vacíos, todo el sitio sigue funcionando exactamente igual
   que hoy, leyendo assets/data/productos.json. Esto es a propósito: ni bien
   se completen los dos valores, el sitio pasa a leer de la base de datos
   real sin tocar ningún otro archivo. */
var MCData = (function () {
  var SUPABASE_URL = '';
  var SUPABASE_ANON_KEY = '';

  var client = null;

  function isConfigured() {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  function getClient() {
    if (client) return client;
    if (!isConfigured() || !window.supabase || !window.supabase.createClient) return null;
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
  }

  function fromStaticFile() {
    return fetch('assets/data/productos.json').then(function (res) {
      return res.json();
    });
  }

  // La vista products_public ya entrega las columnas con el mismo nombre
  // que usa hoy productos.json (rubro, rubroLabel, subcategoria, etc.),
  // así que no hace falta transformar nada acá.
  function getProductos() {
    var sb = getClient();
    if (!sb) return fromStaticFile();

    return sb
      .from('products_public')
      .select('*')
      .then(function (res) {
        if (res.error || !res.data) {
          console.warn('Supabase no respondió, uso el archivo estático de respaldo.', res.error);
          return fromStaticFile();
        }
        return { productos: res.data };
      })
      .catch(function (err) {
        console.warn('Supabase no respondió, uso el archivo estático de respaldo.', err);
        return fromStaticFile();
      });
  }

  return {
    getProductos: getProductos,
    isConfigured: isConfigured,
    getClient: getClient,
  };
})();
