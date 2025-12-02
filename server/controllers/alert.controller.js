// Controlador de alertas: lista, resuelve y combina avisos de stock/entregas.
import Alert from '../models/alert.model.js';
import Delivery from '../models/delivery.model.js';
import {
  ensureAlertConfig,
  updateAlertConfigRecipients
} from '../services/alertConfig.service.js';

/**
 * GET /api/alerts
 * Lista alertas con filtros
 */
export async function listAlerts(req, res) {
  try {
    const status = req.query.status || 'active';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const query = { status };
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Alert.countDocuments(query)
    ]);

    return res.json({
      alerts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error listando alertas:', err);
    return res.status(500).json({ message: 'Error al listar alertas' });
  }
}

/**
 * PATCH /api/alerts/:id/resolve
 * Marca una alerta como resuelta
 */
export async function resolveAlert(req, res) {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: req.user?.id
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    return res.json(alert);
  } catch (err) {
    console.error('Error resolviendo alerta:', err);
    return res.status(500).json({ message: 'Error al resolver alerta' });
  }
}

export async function getAlertConfig(req, res) {
  try {
    const config = await ensureAlertConfig();
    return res.json(config);
  } catch (err) {
    console.error('getAlertConfig', err);
    return res.status(500).json({ message: 'Error al obtener configuracion de alertas' });
  }
}

export async function updateAlertConfig(req, res) {
  try {
    const config = await ensureAlertConfig();
    if (typeof req.body.stockThreshold === 'number') {
      config.stockThreshold = req.body.stockThreshold;
    }
    if (Array.isArray(req.body.notifyStatuses)) {
      config.notifyStatuses = req.body.notifyStatuses.filter(Boolean);
    }
    await updateAlertConfigRecipients(config, req.body.emailRecipients);

    await config.save();
    return res.json(config);
  } catch (err) {
    console.error('updateAlertConfig', err);
    return res.status(500).json({ message: 'Error al guardar configuracion de alertas' });
  }
}

const STATUS_LABELS = {
  pendiente: 'pendiente',
  en_preparacion: 'en preparacion',
  en_camino: 'en camino',
  entregado: 'entregado',
  cancelado: 'cancelado'
};

export async function alertFeed(req, res) {
  try {
    const config = await ensureAlertConfig();
    const [stockAlerts, deliveryAlerts] = await Promise.all([
      Alert.find({ status: 'active' }).sort({ createdAt: -1 }).limit(25).lean(),
      Delivery.find({ status: { $in: config.notifyStatuses || [] } })
        .sort({ updatedAt: -1 })
        .limit(25)
        .lean()
    ]);

    const feed = [
      ...stockAlerts.map((item) => ({
        id: item._id,
        type: 'stock',
        message: item.mensaje,
        producto: item.producto,
        stock: item.stock,
        minStock: item.minStock,
        createdAt: item.createdAt
      })),
      ...deliveryAlerts.map((delivery) => ({
        id: delivery._id,
        type: 'delivery_status',
        status: delivery.status,
        nombrePersona: delivery.nombrePersona,
        fechaEntregaEstimada: delivery.fechaEntregaEstimada,
        message: `Entrega ${delivery.nombrePersona || delivery.id} esta ${STATUS_LABELS[delivery.status] || delivery.status}`,
        createdAt: delivery.updatedAt
      }))
    ];

    // Mezcla y ordena alertas recientes sin importar su origen.
    feed.sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    return res.json({ alerts: feed });
  } catch (err) {
    console.error('alertFeed', err);
    return res.status(500).json({ message: 'Error al obtener feed de alertas' });
  }
}




