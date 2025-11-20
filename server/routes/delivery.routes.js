import express from 'express';
import {
  listDeliveries,
  createDelivery,
  getDeliveryById,
  updateDelivery,
  deleteDelivery
} from '../controllers/delivery.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Listar no requiere auth para facilitar el desarrollo
router.get('/', listDeliveries);
// Crear requiere auth
router.post('/', requireAuth, createDelivery);
// Las demás también requieren auth
router.get('/:id', requireAuth, getDeliveryById);
router.patch('/:id', requireAuth, updateDelivery);
router.delete('/:id', requireAuth, deleteDelivery);

export default router;

