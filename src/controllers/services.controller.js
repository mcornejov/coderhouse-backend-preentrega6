import servicesService from '../services/services.service.js';
import { ValidationError } from '../utils/errors.util.js';
import { responderErrorInterno } from '../utils/responses.util.js';

// El controller recibe la request, delega la lógica en el service y arma la
// response. No accede a la persistencia ni contiene reglas de negocio.

// GET /api/services -> todos los servicios, con filtros opcionales por query params
// Ejemplos: /api/services?category=Talleres  |  /api/services?available=true
export async function getServices(req, res) {
  try {
    let services = await servicesService.getServices();
    const { category, available } = req.query;

    // Solo se filtra si el query param llega como texto simple (no repetido)
    if (typeof category === 'string') {
      services = services.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Solo se aplica el filtro si el valor es 'true' o 'false'; otros se ignoran
    if (available === 'true' || available === 'false') {
      const disponible = available === 'true';
      services = services.filter((s) => s.available === disponible);
    }

    res.status(200).json({ status: 'success', payload: services });
  } catch (error) {
    responderErrorInterno(res, error);
  }
}

// GET /api/services/:sid -> un servicio por id (404 si no existe)
export async function getServiceById(req, res) {
  try {
    const service = await servicesService.getServiceById(req.params.sid);

    if (!service) {
      return res
        .status(404)
        .json({ status: 'error', error: 'Servicio no encontrado' });
    }

    res.status(200).json({ status: 'success', payload: service });
  } catch (error) {
    responderErrorInterno(res, error);
  }
}

// POST /api/services -> crea un servicio (id autogenerado). 400 si los datos son inválidos
export async function createService(req, res) {
  try {
    const nuevo = await servicesService.createService(req.body);
    res.status(201).json({ status: 'success', payload: nuevo });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ status: 'error', error: error.message });
    }
    responderErrorInterno(res, error);
  }
}

// PUT /api/services/:sid -> actualiza un servicio (no permite cambiar el id)
export async function updateService(req, res) {
  try {
    const actualizado = await servicesService.updateService(
      req.params.sid,
      req.body
    );

    if (!actualizado) {
      return res
        .status(404)
        .json({ status: 'error', error: 'Servicio no encontrado' });
    }

    res.status(200).json({ status: 'success', payload: actualizado });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ status: 'error', error: error.message });
    }
    responderErrorInterno(res, error);
  }
}

// DELETE /api/services/:sid -> elimina un servicio (404 si no existe)
export async function deleteService(req, res) {
  try {
    const eliminado = await servicesService.deleteService(req.params.sid);

    if (!eliminado) {
      return res
        .status(404)
        .json({ status: 'error', error: 'Servicio no encontrado' });
    }

    res.status(200).json({ status: 'success', payload: eliminado });
  } catch (error) {
    responderErrorInterno(res, error);
  }
}
