# App Rutas

Aplicación híbrida con Ionic + Angular orientada a la gestión de rutas y entregas, con capacidades móviles (Android) y flujos offline parciales verificados en el código.

## Características principales (verificadas)

- Autenticación con login y almacenamiento de tokens en `localStorage` y SQLite: `src/app/services/auth.service.ts`, `src/app/services/database-movil/repositories/usuario.repository.ts`.
- Listado de rutas por fecha seleccionable: `src/app/pages/private/routes/routes.component.ts`, `src/app/components/datePicker/date-picker.component.ts`, `src/app/services/dale.service.ts`.
- Detalle de ruta con control de orden y progreso de entregas: `src/app/pages/private/routes/route-detail/route-detail.component.ts`, `src/app/services/route-header.service.ts`.
- Detalle de expediente con notas, comensales y acciones rápidas: `src/app/pages/private/routes/route-detail/order-detail/order-detail.component.ts`, `src/app/pages/private/routes/route-detail/order-detail/order-detail.component.html`.
- Entrega manual y entrega validada por QR/NFC mediante modal: `src/app/components/modal-delivery/modal-delivery.component.ts`, `src/app/pages/private/routes/route-detail/order-detail/order-detail.component.ts`.
- Escaneo QR con ML Kit: `src/app/pages/private/routes/route-detail/order-detail/order-detail.component.ts`.
- Lectura NFC con plugin nativo: `src/app/services/nfc.service.ts`, `src/app/pages/private/routes/route-detail/order-detail/order-detail.component.ts`.
- Firma de PDF y envío (offline-first) de documentos: `src/app/components/modal-file/modal-file.component.ts`, `src/app/services/document.service.ts`.
- Persistencia local con SQLite (Capacitor Community): `src/app/services/database-movil/sqlite.service.ts`.
- Comprobación de conectividad y sincronización básica ante reconexión: `src/app/services/network.service.ts`, `src/app/services/sync.service.ts`.

## Stack y tecnologías

Basado en `package.json` y el uso real en `src/`:

- Angular 20.x: `package.json`, `src/main.ts`.
- Ionic Angular 8.x (standalone): `package.json`, `ionic.config.json`, `src/main.ts`.
- Capacitor 7.x (Android configurado, iOS no presente): `package.json`, `capacitor.config.ts`, `android/`.
- HTTP con Axios: `package.json`, `src/app/services/axios.service.ts`.
- Criptografía con `crypto-js` (AES-CBC): `package.json`, `src/app/services/crypto.service.ts`.
- SQLite con `@capacitor-community/sqlite`: `package.json`, `src/app/services/database-movil/sqlite.service.ts`.
- Soporte SQLite en web con `jeep-sqlite` y `sql.js`: `package.json`, `src/index.html`.
- Escaneo QR con `@capacitor-mlkit/barcode-scanning`: `package.json`, `src/app/pages/private/routes/route-detail/order-detail/order-detail.component.ts`.
- NFC con `@exxili/capacitor-nfc`: `package.json`, `src/app/services/nfc.service.ts`.
- PDF y firma: `pdf-lib` y `signature_pad`: `package.json`, `src/app/components/modal-file/modal-file.component.ts`.
- Capacitor Filesystem y File Viewer: `package.json`, `src/app/components/modal-file/modal-file.component.ts`.
- Swiper (componentes web): `package.json`, `src/app/pages/private/routes/route-detail/order-detail/order-detail.component.ts`.

Dependencias presentes pero sin uso verificable en `src/`:

- `dexie`: No encontrado en el repositorio (pendiente de confirmar).

## Arquitectura (visión general)

Puntos de entrada y enrutado:

- Bootstrap y providers: `src/main.ts`.
- Componente raíz e inicialización de la base de datos: `src/app/app.component.ts`.
- Definición de rutas: `src/app/app.routes.ts`.

Capas principales observables en el repo:

- UI/páginas — Layout privado: `src/app/components/private-layout/private-layout.component.ts`.
- UI/páginas — Login público: `src/app/pages/public/login/login.component.ts`.
- UI/páginas — Rutas, detalle de ruta y detalle de expediente: `src/app/pages/private/routes/`.
- Servicios — API y auth: `src/app/services/axios.service.ts`, `src/app/services/auth.service.ts`, `src/app/services/routes.service.ts`.
- Servicios — Criptografía: `src/app/services/crypto.service.ts`.
- Servicios — Conectividad: `src/app/services/network.service.ts`.
- Servicios — Entregas y documentos (offline-first parcial): `src/app/services/delivered-service.service.ts`, `src/app/services/document.service.ts`.
- Servicios — Sincronización: `src/app/services/sync.service.ts` (no se encontró llamada a `init()` en el repositorio).
- Persistencia local — Servicio SQLite y definición de tablas: `src/app/services/database-movil/sqlite.service.ts`.
- Persistencia local — Repositorios: `src/app/services/database-movil/repositories/`.

Flujos offline-first verificados:

- Entregas: primero se guardan en local y después se intenta enviar si hay red: `src/app/services/delivered-service.service.ts`.
- Documentos firmados: primero se guardan en local y después se intenta enviar si hay red: `src/app/services/document.service.ts`.
- Detalle de expediente: cuando hay red se cachea y, si no, se intenta leer local: `src/app/services/delivered-service.service.ts`.

## Estructura del proyecto (árbol resumido)

```text
C:\Proyectos\app_rutas
|-- android/
|-- src/
|   |-- app/
|   |   |-- components/
|   |   |-- pages/
|   |   |   |-- private/routes/
|   |   |   \-- public/login/
|   |   |-- services/
|   |   |   \-- database-movil/
|   |   \-- types/
|   |-- assets/
|   \-- environments/
|-- angular.json
|-- capacitor.config.ts
|-- ionic.config.json
\-- package.json
```

## Requisitos previos

- Node.js y npm: No encontrado en el repositorio (pendiente de confirmar).
- Android Studio y SDKs de Android si vas a compilar nativo: `android/`.
- Android — `minSdkVersion = 23`: `android/variables.gradle`.
- Android — `compileSdkVersion = 35`: `android/variables.gradle`.
- Android — `targetSdkVersion = 35`: `android/variables.gradle`.
- Android — Gradle wrapper 8.11.1: `android/gradle/wrapper/gradle-wrapper.properties`.

## Instalación (Windows 11 / PowerShell)

Con `package-lock.json` presente, se recomienda `npm ci`:

```powershell
cd C:\Proyectos\app_rutas
npm ci
```

## Ejecución en local

### Web

Scripts reales en `package.json`:

```powershell
npm run start
```

Notas verificadas:

- El `outputPath` de build apunta a `www`: `angular.json`.
- El servidor de desarrollo usa proxy `proxy.conf.json`: `angular.json`.

### Android (Capacitor)

No hay scripts específicos en `package.json`, pero sí está `@capacitor/cli`:

```powershell
npm run build
npx cap sync android
npx cap open android
```

Permisos Android relevantes para la app:

- Cámara y NFC: `android/app/src/main/AndroidManifest.xml`.

## Configuración (environments y claves)

Archivos de entorno:

- Desarrollo: `src/environments/environment.ts`.
- Producción: `src/environments/environment.prod.ts`.

Claves de configuración encontradas (solo nombres):

- `apiUrl`: `src/environments/environment.ts`, `src/environments/environment.prod.ts`.
- `production`: `src/environments/environment.ts`, `src/environments/environment.prod.ts`.
- `apiSecret`: `src/environments/environment.ts`, `src/environments/environment.prod.ts`.

Claves en `localStorage` usadas por la app:

- `access_token`, `refresh_token`: `src/app/services/auth.service.ts`, `src/app/services/axios.service.ts`.
- `username`: `src/app/services/auth.service.ts`, `src/app/pages/public/login/login.component.ts`.
- `loggedAt`: `src/app/services/auth.service.ts`.

## Integración con API

### Base URL y proxy

Configuración observada:

- La base URL se toma de `environment.apiUrl`: `src/app/services/axios.service.ts`.
- Entorno desarrollo — `apiUrl`: `https://devproxy.ucalsaserviciossociosanitarios.com/api/`: `src/environments/environment.ts`.
- Entorno producción — `apiUrl`: `https://proxy.ucalsaserviciossociosanitarios.com/api/`: `src/environments/environment.prod.ts`.
- Proxy `/api` — `proxy.conf.json`: `https://gstag3.virtualsw.es/ucalsaweb`.
- Proxy `/api` — `ionic.config.json`: `https://gstag3.virtualsw.es/ucalsaweb`.

### Endpoints detectados en código

Definidos explícitamente en servicios:

- `POST /login`: `src/app/services/auth.service.ts`.
- `GET /v1/rutas/disponibles`: `src/app/services/routes.service.ts`.
- `GET /v1/rutas/repartos`: `src/app/services/routes.service.ts`.
- `GET /v1/rutas/entregas`: `src/app/services/routes.service.ts`.
- `POST v1/entregas/entregar`: `src/app/services/routes.service.ts`.
- `GET v1/entregas/expediente?qr=...`: `src/app/services/routes.service.ts`.
- `GET v1/entregas/motivos`: `src/app/services/routes.service.ts`.
- `GET v1/documentos/tipos`: `src/app/services/routes.service.ts`.

### Autenticación y cabeceras

Comportamiento verificado:

- `AxiosService` añade `Authorization: Bearer <token>` si existe `access_token` en `localStorage`: `src/app/services/axios.service.ts`.
- También envía la cabecera `apiSecret` tomada del entorno: `src/app/services/axios.service.ts`.
- Ante `401`, se limpian tokens y se redirige a `/login`: `src/app/services/axios.service.ts`.

### Cifrado y descifrado

Mecanismo observado:

- El descifrado se realiza en `CryptoService`: `src/app/services/crypto.service.ts`.
- Se usa AES-CBC (`crypto-js`): `src/app/services/crypto.service.ts`.
- Clave derivada del `username` guardado en SQLite: `src/app/services/crypto.service.ts`, `src/app/services/database-movil/repositories/usuario.repository.ts`.
- IV derivado de `apiSecret`: `src/app/services/crypto.service.ts`.
- El payload cifrado se consume típicamente desde `response.data.data`: `src/app/types/axios.type.ts`, `src/app/pages/private/routes/routes.component.ts`.

## Base de datos local / almacenamiento offline

Servicio principal:

- Conexión y tablas: `src/app/services/database-movil/sqlite.service.ts`.
- Nombre de base de datos: `db_rutas`: `src/app/services/database-movil/sqlite.service.ts`.

Tablas detectadas y propósito inferido desde el código:

- `usuarios`: sesión del usuario y tokens: `src/app/services/database-movil/sqlite.service.ts`, `src/app/services/database-movil/repositories/usuario.repository.ts`.
- `rutas_local`: rutas cacheadas por fecha: `src/app/services/database-movil/sqlite.service.ts`, `src/app/services/database-movil/repositories/rutas_local.repository.ts`.
- `expedientes_local`: expedientes por ruta: `src/app/services/database-movil/sqlite.service.ts`, `src/app/services/database-movil/repositories/expedientes_local.repository.ts`.
- `expedientes_detalle_local`: detalle de expediente (notas y comensales): `src/app/services/database-movil/sqlite.service.ts`, `src/app/services/database-movil/repositories/expedientes_detalle_local.repository.ts`.
- `urgencias_local`: documentos firmados y estado: `src/app/services/database-movil/sqlite.service.ts`, `src/app/services/database-movil/repositories/urgencias_local.repository.ts`.
- `entregas_local`: entregas registradas localmente y estado de sincronización: `src/app/services/database-movil/sqlite.service.ts`, `src/app/services/database-movil/repositories/entregas_local.repository.ts`.

Notas importantes verificadas:

- La base de datos se abre al iniciar la app: `src/app/app.component.ts`.
- Existe lógica para compatibilidad/migración de `entregas_local.fecha`: `src/app/services/database-movil/sqlite.service.ts`.

## Tests y calidad

Scripts disponibles en `package.json`:

```powershell
npm run lint
npm run test
npm run build
```

Herramientas configuradas:

- ESLint con Angular ESLint: `.eslintrc.json`.
- Karma + Jasmine para tests: `karma.conf.js`.

CI, hooks o formateo automático: No encontrado en el repositorio (pendiente de confirmar).

## Troubleshooting (basado en el repo)

- QR y NFC solo están habilitados en entorno nativo (no web): `src/app/pages/private/routes/route-detail/order-detail/order-detail.component.ts`, `src/app/services/nfc.service.ts`.
- El escaneo QR requiere permisos de cámara y la app declara `android.permission.CAMERA`: `src/app/pages/private/routes/route-detail/order-detail/order-detail.component.ts`, `android/app/src/main/AndroidManifest.xml`.
- La lectura NFC requiere hardware compatible y la feature NFC está marcada como opcional: `android/app/src/main/AndroidManifest.xml`.
- SQLite en web depende de `<jeep-sqlite>` y de cargar `sql.js` desde un CDN: `src/index.html`.
- Si la API devuelve `401`, la app limpia tokens y vuelve a login: `src/app/services/axios.service.ts`.

iOS: No encontrado en el repositorio (pendiente de confirmar).

## Contribución

Guías de contribución, estrategia de ramas o convención de commits: No encontrado en el repositorio (pendiente de confirmar).

## Licencia

Archivo `LICENSE`: No encontrado en el repositorio (pendiente de confirmar).
