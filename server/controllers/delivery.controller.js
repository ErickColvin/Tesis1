import mongoose from 'mongoose';
import Delivery from '../models/delivery.model.js';

const buildDeliveryFilter = (identifier) => {
  const or = [{ id: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    or.push({ _id: identifier });
  }
  return { $or: or };
};

/**
 * GET /api/deliveries
 * Lista todos los deliveries con paginación
 */
export async function listDeliveries(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [deliveries, total] = await Promise.all([
      Delivery.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Delivery.countDocuments(query)
    ]);

    return res.json({
      deliveries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error listando deliveries:', err);
    return res.status(500).json({ ok: false, error: 'Error al listar deliveries' });
  }
}

/**
 * POST /api/deliveries
 * Crea un nuevo delivery
 */
export async function createDelivery(req, res) {
  try {
    const {
      nombrePersona,
      nombreProductos,
      cantidad,
      status,
      direccion,
      fechaEntregaEstimada,
      notas,
      plataforma
    } = req.body;

    // Validaciones
    if (!nombrePersona || !nombreProductos || !cantidad || !direccion || !fechaEntregaEstimada) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    // Generar ID único
    const id = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const delivery = await Delivery.create({
      id,
      nombrePersona,
      nombreProductos,
      cantidad: parseInt(cantidad),
      status: status || 'pendiente',
      direccion,
      fechaEntregaEstimada: new Date(fechaEntregaEstimada),
      notas: notas || '',
      plataforma: plataforma || 'delivery',
      user: req.user?.id
    });

    return res.status(201).json(delivery);
  } catch (err) {
    console.error('Error creando delivery:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Datos inválidos', errors: err.errors });
    }
    
    return res.status(500).json({ message: 'Error al crear delivery' });
  }
}

/**
 * GET /api/deliveries/:id
 * Obtiene un delivery por ID
 */
export async function getDeliveryById(req, res) {
  try {
    const delivery = await Delivery.findOne(buildDeliveryFilter(req.params.id));
    
    if (!delivery) {
      return res.status(404).json({ ok: false, error: 'Delivery no encontrado' });
    }

    return res.json(delivery);
  } catch (err) {
    console.error('Error obteniendo delivery:', err);
    return res.status(500).json({ ok: false, error: 'Error al obtener delivery' });
  }
}

/**
 * PATCH /api/deliveries/:id
 * Actualiza un delivery
 */
export async function updateDelivery(req, res) {
  try {
    const delivery = await Delivery.findOneAndUpdate(
      buildDeliveryFilter(req.params.id),
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!delivery) {
      return res.status(404).json({ ok: false, error: 'Delivery no encontrado' });
    }

    return res.json(delivery);
  } catch (err) {
    console.error('Error actualizando delivery:', err);
    return res.status(500).json({ ok: false, error: 'Error al actualizar delivery' });
  }
}

/**
 * DELETE /api/deliveries/:id
 * Elimina un delivery
 */
export async function deleteDelivery(req, res) {
  try {
    const delivery = await Delivery.findOneAndDelete(buildDeliveryFilter(req.params.id));
    
    if (!delivery) {
      return res.status(404).json({ ok: false, error: 'Delivery no encontrado' });
    }

    return res.json({ ok: true, message: 'Delivery eliminado' });
  } catch (err) {
    console.error('Error eliminando delivery:', err);
    return res.status(500).json({ ok: false, error: 'Error al eliminar delivery' });
  }
}




