/* ===== Mi Dinero · configuración de nube (Supabase) =====
   Deja los dos valores vacíos y la app funciona solo en este navegador (localStorage).
   Con URL + publishable key, aparece "Nube" en Cuentas y ajustes: inicias sesión con tu correo
   (enlace mágico) y tus datos se guardan en tu fila privada de Supabase, sincronizada entre dispositivos.
   Estos valores son públicos por diseño; lo que protege tus datos son las políticas RLS de supabase-setup.sql. */
window.SUPABASE = {
  url: 'https://gzohwqnljjptattirkrr.supabase.co',
  anonKey: 'sb_publishable_Gn4Zu1DHMDlP8OC8W9XvJA_bI0FhjRu', // publishable key (pública por diseño)
  email: 'tashisnothere@gmail.com', // correo precargado en el formulario de inicio de sesión
};
