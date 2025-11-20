import Alert from '../models/alert.model.js';

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

