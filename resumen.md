Resumen del proyecto "App-rutas"

Visión general
- Aplicación híbrida construida con Ionic + Angular (v20) para gestionar rutas y entregas. Soporta uso offline con SQLite (Capacitor + @capacitor-community/sqlite / jeep-sqlite), escaneo QR, firma de PDFs y sincronización con una API remota.

Tecnologías y dependencias clave
- Angular 20, Ionic Angular v8 (componentes standalone).
- Capacitor (core, android, ios) y plugins: Network, AppLauncher, Filesystem, FileViewer, Keyboard, Haptics, Preferences.
- SQLite y repositorios locales: @capacitor-community/sqlite, jeep-sqlite, sql.js (web fallback).
- QR scanner: @capacitor-mlkit/barcode-scanning.
- HTTP: axios (envuelto por `AxiosService`).
- Criptografía: crypto-js (desencriptación AES-CBC de respuestas API).
- PDF y firma: pdf-lib, signature_pad.

Puntos de entrada y build
- Punto de arranque: `src/main.ts` (bootstrapApplication) y router principal en `src/app/app.routes.ts`.
- `index.html` incluye jeep-sqlite y sql.js para soporte web y el elemento `<jeep-sqlite>`.
- Salida de build: carpeta `www` (config en `angular.json`).

Arquitectura y navegación
- Rutas principales:
	- `/login` (LoginComponent)
	- `/privado` (PrivateLayoutComponent) con children:
		- `/privado/rutas` (RoutesComponent)
		- `/privado/rutas/:id` (RouteDetailComponent)
		- `/privado/rutas/:id/:expediente` (OrderDetailComponent)
	- `**` → ErrorComponent
- `NavigationService` controla la navegación atrás con reglas específicas. `RouteHeaderService` maneja títulos/subtítulos del header.

Funcionalidades principales
- Autenticación: login que guarda `access_token` y `refresh_token` (localStorage y SQLite).
- Consulta de rutas y detalle: obtiene datos de `/v1/rutas/disponibles`, `/v1/rutas/repartos`, `/v1/rutas/entregas`, desencripta la respuesta y almacena en DB local.
- Soporte offline: si no hay conexión usa tablas locales (`rutas_local`, `expedientes_local`, `expedientes_detalle_local`).
- Entregas:
	- Entrega manual mediante modal (motivo, observaciones). Si falla la llamada API se guarda en `entregas_local` con `synced = 0`.
	- Entrega por QR mediante escaneo y validación con la API.
- Firma de documentos PDF:
	- Subir PDF, firmar con canvas (signature_pad), incrustar la firma con pdf-lib y subir mediante `RoutesService.postPdf`.
	- Guardar urgencias en `urgencias_local` con `firmado` y base64.
- Feedback: toasts (`ToastService`), loading component y timeline en el detalle de ruta.

Servicios y lógica
- `AxiosService`: wrapper axios con baseURL '/api', apiSecret header, interceptores para Authorization y manejo 401.
- `AuthService`: login/logout y guardado del usuario en `UsuarioRepository`.
- `CryptoService`: desencripta la carga cifrada de la API (AES-CBC). Usa `username` desde DB y `environment.apiSecret`.
- Varios repositorios SQLite en `src/app/services/database-movil/repositories` encapsulan CRUD y queries.

Modelo de datos local (tablas y tipos)
- `usuarios` (username, roles, access_token, refresh_token, token_type, expires_in, loggedAt)
- `rutas_local` (ruta_id, ruta, fecha, cachedAt)
- `expedientes_local` (expediente_id, ruta_id, expediente, direccion, orden, comidas, cenas, cachedAt)
- `expedientes_detalle_local` (expediente, expediente_id, notas, comensales, synced, cachedAt)
- `urgencias_local` (expediente_id, pdfBase64, firmado, firmadoBase64, cachedAt)
- `entregas_local` (id, ruta_id, expediente_id, metodo, qrCode, motivo, observacion, timestamp, synced)

Flujos offline/online
- Al cargar datos: si hay conexión → pedir API, desencriptar y cachear; si no → leer cache local.
- Entregas offline se almacenan y quedan pendientes para sincronizar (campo `synced`).

Seguridad y observaciones
- La desencriptación depende de que `Usuario` exista en la DB local; esto es un punto crítico.
- Tokens en localStorage; considerar almacenamiento seguro en móvil.

Siguientes pasos:
- Falta implementar un sincronizador (PR) que:
	- Escuche reconexión de red y sincronice `entregas_local`.
	- Marque registros como `synced`.
- Falta terminar de implementar la lógica de los documentos:

```
(Respuesta de Alberto)
Buenos días Jonatan,

No sé a qué te refieres con entregas de urgencias. Pero en el API tienes dos endPoints para gestionar documentos:
- Gestión de recibís: Primero tendrás que obtener la lista de tipos de recibí utilizando "Lista tipos de recibí" y después 	solicitar el fichero para un tipo y expediente con "Solicitar recibí". Teóricamente este documento debe ser firmado por el comensal correspondiente y suponemos que debe ser subido a la aplicación utilizando el siguiente endPoint
- Gestión de documentos: Primero tendrás que obtener la lista de tipos de documento utilizando "Lista tipos de documento" y posteriormente subir el fichero para un tipo y expediente con "Alta de documento"
Espero que esto responda tu pregunta, sino intenta decirme exactamente qué es lo que necesitas o pregúntale a Paz que es lo que quieren que hagáis exactamente.

```

Dudas:
- En que momento debemos limpiar todas las tablas de la db local? al iniciar sesión en un día nuevo? por ejemplo.

Fin del resumen.