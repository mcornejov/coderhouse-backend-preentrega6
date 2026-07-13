import express from 'express';
import servicesRouter from './routes/services.router.js';
import bookingsRouter from './routes/bookings.router.js';

const app = express();

// Middleware para interpretar el body de las peticiones en formato JSON
app.use(express.json());

// Rutas de los recursos
app.use('/api/services', servicesRouter);
app.use('/api/bookings', bookingsRouter);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ status: 'error', error: 'Ruta no encontrada' });
});

// Middleware de manejo de errores (cuatro argumentos)
app.use((err, req, res, next) => {
  // Body con JSON mal formado: es un error del cliente, no del servidor
  if (err.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ status: 'error', error: 'El body de la petición no es un JSON válido.' });
  }

  console.error(err);
  res.status(500).json({ status: 'error', error: 'Error interno del servidor' });
});

export default app;
