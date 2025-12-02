// Rutas de entregas/paqueteria con proteccion por rol.
import express from 'express';
import {
  listDeliveries,
  createDelivery,
  getDeliveryById,
  updateDelivery,
  deleteDelivery
} from '../controllers/delivery.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Listar no requiere auth para facilitar el desarrollo
router.get('/', listDeliveries);
// Crear requiere auth
router.post('/', requireAuth, requireAdmin, createDelivery);
// Las demás también requieren auth y privilegios apropiados
router.get('/:id', requireAuth, getDeliveryById);
router.patch('/:id', requireAuth, requireAdmin, updateDelivery);
router.delete('/:id', requireAuth, requireAdmin, deleteDelivery);

export default router;
