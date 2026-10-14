# Página del grupo de senderismo

React + Vite + React Router, con reservas en Supabase y publicación en GitHub Pages.

## Páginas

- `/` Inicio (portada, tours, eventos gratuitos, eventos privados, quiénes somos)
- `/eventos` Lista de eventos (con filtro `?tipo=tour` o `?tipo=gratuito`)
- `/eventos/<slug>` Detalle del evento y botón Registrarme (abre la ventana "Apartar evento")
- `/reserva/<id>` Datos de transferencia (o confirmación si el evento es gratuito)

Las direcciones llevan `#` (ej. `/#/eventos`) para que funcionen en GitHub Pages.

## Probar en tu computadora

1. Instala Node.js (versión LTS) desde https://nodejs.org
2. Dentro de esta carpeta:

   npm install
   npm run dev

3. Abre http://localhost:5173

Sin Supabase configurado, la página funciona en **modo demostración** con los eventos de
`src/data/eventos.json` y las reservas no se guardan.

## Conectar Supabase

1. Crea un proyecto gratis en https://supabase.com
2. En el SQL Editor, pega y ejecuta `schema_reservas.sql`.
3. Copia `.env.example` como `.env.local` y pon tu URL y tu clave pública
   (Project Settings > API). Detén el servidor (Ctrl + C) y vuelve a ejecutar `npm run dev`.
4. Crea tus eventos en Table Editor > events (o con el ejemplo al final de `schema_reservas.sql`).
5. Las reservas llegan a Table Editor > reservations. Cuando confirmes un pago, cambia
   `status` de `pendiente` a `pagada`.

## Personalizar

- `src/config.js`: nombre, lema, WhatsApp o correo, datos de transferencia, textos.
- `public/hero.jpg`: foto de la portada (si no existe, se ve un paisaje ilustrado).
- `public/carta-responsabilidad.pdf`: tu carta de responsabilidad (el enlace "Ver carta").
- Foto de cada evento: llena la columna `image_url` de la tabla `events` con un enlace a la imagen.

## Publicar en GitHub Pages

1. Sube este proyecto a un repositorio de GitHub, rama `main`.
2. Settings > Pages > Source: GitHub Actions.
3. Settings > Secrets and variables > Actions: crea `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Cada push a `main` publica la página.

Nunca pongas la clave `service_role` en el frontend.
