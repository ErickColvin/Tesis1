// Controlador de importaciones: recibe archivos y expone logs de cargas.
import Import from '../models/import.model.js';
import { ImportService } from '../services/import.service.js';
import { notifyImportSummary } from '../services/notification.service.js';

/**
 * POST /api/imports
 * Endpoint principal de importación
 * 
 * Body:
 * - file: multipart/form-data
 * - type: 'products' | 'packages' (opcional, default 'products')
 */
export async function importData(req, res) {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ ok: false, error: 'Archivo requerido' });
    }

    const type = req.body.type || 'products';
    const userId = req.user?.id;

    // Procesar según tipo
    let result;
    if (type === 'packages') {
      result = await ImportService.processPackageImport(req.file.buffer, userId);
    } else {
      result = await ImportService.processProductImport(req.file.buffer, userId);
    }

    // Guardar registro de importación
    // Resumen compacto para guardar en BD y enviar por correo.
    const summary = {
      rowsTotal: result.rowsTotal,
      rowsOk: result.rowsOk,
      rowsError: result.rowsError,
      productsCreated: result.productsCreated || 0,
      productsUpdated: result.productsUpdated || 0,
      packagesCreated: result.packagesCreated || 0,
      packagesUpdated: result.packagesUpdated || 0
    };

    const importRecord = await Import.create({
      fileName: req.file.originalname,
      rowsTotal: summary.rowsTotal,
      rowsOk: summary.rowsOk,
      rowsError: summary.rowsError,
      importErrors: result.errors, // Cambiado de 'errors' a 'importErrors' para evitar warning
      productsCreated: summary.productsCreated,
      productsUpdated: summary.productsUpdated,
      packagesCreated: summary.packagesCreated,
      packagesUpdated: summary.packagesUpdated,
      user: userId
    });

    await notifyImportSummary({
      fileName: req.file.originalname,
      summary,
      errors: result.errors || []
    });

    return res.json({
      ok: true,
      importId: importRecord._id,
      summary,
      errors: (result.errors || []).slice(0, 10) // Primeros 10 errores
    });

  } catch (err) {
    console.error('Error en import:', err);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error al procesar importación', 
      detail: err.message 
    });
  }
}

/**
 * GET /api/imports
 * Lista imports realizados
 */
export async function listImports(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    const [imports, total] = await Promise.all([
      Import.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Import.countDocuments({})
    ]);

    return res.json({
      imports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error listando imports:', err);
    return res.status(500).json({ ok: false, error: 'Error al listar imports' });
  }
}

/**
 * GET /api/imports/:id
 * Detalle de un import específico
 */
export async function getImportById(req, res) {
  try {
    const importRecord = await Import.findById(req.params.id);
    
    if (!importRecord) {
      return res.status(404).json({ ok: false, error: 'Import no encontrado' });
    }

    return res.json(importRecord);
  } catch (err) {
    console.error('Error obteniendo import:', err);
    return res.status(500).json({ ok: false, error: 'Error al obtener import' });
  }
}
