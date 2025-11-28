import Return from '../models/return.model.js';

export async function listReturns(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Return.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Return.countDocuments()
    ]);

    return res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('listReturns', err);
    return res.status(500).json({ message: 'internal_error' });
  }
}

export async function createReturn(req, res) {
  try {
    const {
      marketplaceOrderId,
      producto,
      sku,
      cantidad,
      motivo,
      estadoProducto,
      resultado,
      comentarios,
      customerEmail,
      fechaRecoleccion
    } = req.body;

    if (!marketplaceOrderId || !producto || !cantidad || !motivo) {
      return res.status(400).json({ message: 'missing_fields' });
    }

    const record = await Return.create({
      marketplaceOrderId,
      producto,
      sku,
      cantidad,
      motivo,
      estadoProducto,
      resultado,
      comentarios,
      customerEmail,
      fechaRecoleccion,
      recibidoPor: req.user?.id
    });

    return res.status(201).json(record);
  } catch (err) {
    console.error('createReturn', err);
    return res.status(500).json({ message: 'internal_error' });
  }
}

export async function updateReturn(req, res) {
  try {
    const { id } = req.params;
    const allowed = [
      'marketplaceOrderId',
      'producto',
      'sku',
      'cantidad',
      'motivo',
      'estadoProducto',
      'resultado',
      'comentarios',
      'customerEmail',
      'fechaRecoleccion'
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const record = await Return.findByIdAndUpdate(id, updates, { new: true });
    if (!record) {
      return res.status(404).json({ message: 'not_found' });
    }

    return res.json(record);
  } catch (err) {
    console.error('updateReturn', err);
    return res.status(500).json({ message: 'internal_error' });
  }
}
