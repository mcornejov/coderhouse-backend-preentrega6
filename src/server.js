import config from './config/env.config.js';
import { connectDB } from './config/db.config.js';
import app from './app.js';

// Primero se establece la conexión con MongoDB y recién después se levanta el
// servidor HTTP, para no aceptar peticiones sin base de datos disponible.
await connectDB();

app.listen(config.port, () => {
  console.log(
    `Servidor de turnos y reservas escuchando en http://localhost:${config.port} (modo ${config.nodeEnv})`
  );
});
