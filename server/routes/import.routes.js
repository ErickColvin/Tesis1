import express from 'express';
import multer from 'multer';
import { importData, listImports, getImportById } from '../controllers/import.controller.js';

const router = express.Router();

// Configurar multer para archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo archivos Excel (.xlsx, .xls) permitidos'), false);
    }
  }
});

// POST /api/imports - Importar datos
router.post('/', upload.single('file'), importData);

// GET /api/imports - Listar imports
router.get('/', listImports);

// GET /api/imports/:id - Detalle de import
router.get('/:id', getImportById);

export default router;

