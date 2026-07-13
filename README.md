# Café Aurora · API de Servicios y Reservas (Turnos)

API REST construida con **Node.js + Express** (ES Modules) que gestiona los recursos
`services` y `bookings` del Sistema Backend de Turnos y Reservas de Café Aurora. En esta
etapa la persistencia migra desde archivos JSON hacia **MongoDB Atlas** usando **Mongoose**.

El comportamiento externo de la API no cambia: los mismos endpoints siguen funcionando igual.
Lo único que cambia es **cómo** se almacenan y consultan los datos. La arquitectura en capas
se mantiene, y la migración se concentra en la capa DAO y en los modelos.

## Descripción

- **services**: las experiencias reservables de Café Aurora (catas, talleres, arriendo de
  espacios). Se pueden listar, consultar, crear, actualizar y eliminar.
- **bookings**: las reservas de los clientes. Cada reserva referencia servicios mediante su
  `ObjectId` y una `quantity`, nunca el objeto completo.
- **messages**: colección de mensajes, disponible para las funcionalidades en tiempo real de
  las siguientes etapas.

## Arquitectura en capas

```
router → controller → service → repository → DAO → Mongoose → MongoDB Atlas
```

| Capa           | Responsabilidad                                                              |
|----------------|------------------------------------------------------------------------------|
| **Router**     | Define los endpoints y los conecta con su controller.                        |
| **Controller** | Lee `req`, llama al service y responde con `res`.                            |
| **Service**    | Concentra las reglas de negocio. No conoce `req`/`res` ni la persistencia.    |
| **Repository** | Ofrece métodos de acceso a datos y desacopla al service de la fuente.         |
| **DAO**        | Lee y escribe en MongoDB a través de los modelos de Mongoose.                 |
| **Models**     | Schemas de Mongoose: `Service`, `Booking`, `Message`.                        |

## Requisitos

- Node.js 18 o superior.
- Una base de datos en **MongoDB Atlas** (o un MongoDB accesible por URI).

## Instalación

```bash
git clone https://github.com/mcornejov/coderhouse-backend-preentrega6.git
cd coderhouse-backend-preentrega6
pnpm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz tomando como referencia `.env.example`:

```bash
PORT=8080
NODE_ENV=development
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/cafe_aurora
```

| Variable    | Descripción                              | Ejemplo                                  |
|-------------|------------------------------------------|------------------------------------------|
| `PORT`      | Puerto en el que escucha el server       | `8080`                                   |
| `NODE_ENV`  | Entorno de ejecución                     | `development`                            |
| `MONGO_URI` | URI de conexión a MongoDB Atlas          | `mongodb+srv://...@cluster/cafe_aurora`  |

Si falta una variable obligatoria, la app no inicia y avisa con un mensaje claro
(patrón Fail-Fast). El `.env` **no** se sube al repositorio: contiene credenciales.

## Ejecución

```bash
pnpm start       # levanta el servidor (src/server.js)
pnpm dev         # levanta con recarga automática (node --watch)
```

Al iniciar, primero se conecta a MongoDB Atlas y recién después queda escuchando en
`http://localhost:8080`.

## Endpoints

### Recurso `services` — base `/api/services`

| Método   | Ruta                 | Descripción                                         | Códigos       |
|----------|----------------------|-----------------------------------------------------|---------------|
| `GET`    | `/api/services`      | Lista todos los servicios. Filtros por query params.| `200`         |
| `GET`    | `/api/services/:sid` | Devuelve un servicio por id.                        | `200` / `404` |
| `POST`   | `/api/services`      | Crea un servicio (id autogenerado por MongoDB).     | `201` / `400` |
| `PUT`    | `/api/services/:sid` | Actualiza un servicio. No permite modificar el id.  | `200` / `404` / `400` |
| `DELETE` | `/api/services/:sid` | Elimina un servicio.                                | `200` / `404` |

Filtros de `GET /api/services`: `?category=Talleres` y `?available=true`.

### Recurso `bookings` — base `/api/bookings`

| Método | Ruta                                | Descripción                                            | Códigos       |
|--------|-------------------------------------|--------------------------------------------------------|---------------|
| `POST` | `/api/bookings`                     | Crea una reserva (puede iniciar con `services` vacío). | `201` / `400` |
| `GET`  | `/api/bookings/:bid`                | Devuelve una reserva por id.                           | `200` / `404` |
| `POST` | `/api/bookings/:bid/services/:sid`  | Asocia un servicio existente a la reserva.             | `200` / `404` |

Las respuestas siguen el formato `{ "status": "success" | "error", "payload" | "error": ... }`.

## Recursos

### `service`

```json
{
  "_id": "6a556a8892a978fa9234fe9a",
  "name": "Cata de café de especialidad",
  "description": "Degustación guiada de cinco orígenes.",
  "duration": 60,
  "price": 15000,
  "category": "Experiencias",
  "available": true
}
```

### `booking`

```json
{
  "_id": "6a556a8992a978fa9234fea3",
  "clientName": "Camila Rojas",
  "clientEmail": "camila@example.cl",
  "date": "2026-08-01",
  "time": "16:00",
  "status": "pending",
  "services": [
    { "service": "6a556a8892a978fa9234fe9c", "quantity": 1 }
  ]
}
```

**Relación con `services`:** la reserva guarda el `ObjectId` del servicio y su `quantity`, no
el objeto completo. Si se agrega el mismo servicio otra vez, se incrementa `quantity`.

## Cómo probar la API

Con el servidor corriendo (`pnpm start`), en otra terminal:

```bash
# Crear un servicio
curl -X POST http://localhost:8080/api/services \
  -H "Content-Type: application/json" \
  -d '{"name":"Taller de barismo","description":"Intro a espresso","duration":90,"price":25000,"category":"Talleres","available":true}'

# Crear una reserva (services vacío)
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"clientName":"Camila Rojas","clientEmail":"camila@example.cl","date":"2026-08-01","time":"16:00"}'

# Asociar un servicio a la reserva (usa los _id devueltos arriba)
curl -X POST http://localhost:8080/api/bookings/<bid>/services/<sid>
```

## Estructura del proyecto

```
src/
  config/
    env.config.js               # Carga y valida variables de entorno (Fail-Fast)
    db.config.js                # Conexión a MongoDB Atlas con Mongoose
  models/
    service.model.js            # Schema y modelo de servicios
    booking.model.js            # Schema y modelo de reservas (services por ObjectId)
    message.model.js            # Schema y modelo de mensajes
  controllers/
    services.controller.js      # Recibe la request, llama al service y responde
    bookings.controller.js
  services/
    services.service.js         # Reglas de negocio de servicios
    bookings.service.js         # Reglas de negocio de reservas (incrementa quantity)
  repositories/
    services.repository.js      # Acceso a datos desacoplado de la fuente
    bookings.repository.js
  dao/
    services.dao.js             # Acceso a la colección services vía Mongoose
    bookings.dao.js             # Acceso a la colección bookings vía Mongoose
  routes/
    services.router.js          # Endpoints del recurso services (sin lógica)
    bookings.router.js
  utils/
    errors.util.js              # ValidationError (400) y NotFoundError (404)
    responses.util.js           # Helpers de respuesta compartidos
  app.js                        # Configuración de Express (middlewares + routers)
  server.js                     # Punto de entrada: conecta a Mongo y levanta el server
.env.example
.gitignore
package.json
README.md
```
