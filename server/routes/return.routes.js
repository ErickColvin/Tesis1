import express from 'express';
import { listReturns, createReturn, updateReturn } from '../controllers/return.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.post('/', createReturn);
// Listar devoluciones: disponible para cualquier usuario autenticado (incluye clientes)
router.get('/', listReturns);
router.patch('/:id', requireAdmin, updateReturn);

export default router;
